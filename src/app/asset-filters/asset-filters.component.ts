import { Component } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { Subscription } from 'rxjs/Subscription'
import { Angulartics2 } from 'angulartics2'

import { AssetService } from '../shared/assets.service'
import { AssetFiltersService } from '../asset-filters/asset-filters.service'
import { AuthService, FlagService } from "app/shared";

declare var _satellite: any

@Component({
  selector: 'ang-asset-filters',
  styleUrls: [ './asset-filters.component.scss' ],
  templateUrl: './asset-filters.component.pug'
})
export class AssetFilters {
  // Set our default values
  public searchLoading: boolean
  public showFilters: boolean = true
  public showAdvancedModal: boolean = false
  private subscriptions: Subscription[] = []
  private filterDate: boolean = false
  private filterNameMap: any = {}

  errors = {}
  results = []
  appliedFilters = []
  availableFilters: any = {}

  // collTypeFacets = [];
  // classificationFacets = [];
  geoTree = [];
  // geographyFacets = [];

  pagination = {
    page : 1,
    totalPages : 1,
    size : 24
  };
  activeSort = {
    index : 0,
    label : 'Relevance'
  };
  term;
  // TO-DO: Fields should be pulled dynamically!
  public fields = [
    {name: 'Title' },
    {name: 'Creator' },
    {name: 'Location' },
    {name: 'Repository' }
  ];

  public geographyFields = [ ];

  public advQueryTemplate = { term: '' };

  public advanceQueries = [
    { term: ''},
    { term: ''}
  ];

  private dateError: boolean = false;

  // TypeScript public modifiers
  constructor(
    private _filters: AssetFiltersService,
    private route: ActivatedRoute,
    private router: Router,
    private angulartics: Angulartics2,
    private _auth: AuthService,
    private _flags: FlagService
  ) {
  }


  ngOnInit() {

    this.filterNameMap = this._filters.getFilterNameMap()

    // Read filters from URL
    this.subscriptions.push(
      this.route.params.subscribe((routeParams) => {
        this.term = routeParams["term"];

        if(routeParams['startDate'] && routeParams['endDate']){
          this.filterDate = true;
        }

        // When params are adjusted, applied filters need to be cleared
        // this._filters.clearApplied();

        // Find feature flags
        if(routeParams && routeParams['featureFlag']){
            this._flags[routeParams['featureFlag']] = true
        }

        for (let paramName in routeParams) {
            if (this._filters.isFilterGroup(paramName)) {
              let parsedParam:any

              try { // attempt to parse an array param
                parsedParam = JSON.parse(routeParams[paramName])
              } catch (err) { // param is not an array
                parsedParam = routeParams[paramName]
              }
              this._filters.apply(paramName, parsedParam);
            }
        }
      })
    );

    // Keep an eye for available filter updates
    this.subscriptions.push(
      this._filters.available$.subscribe(
        filters => {
          // Clean up filter data for display (i.e. insitutional asset counts are inaccurate)
          if (filters['collectiontypes']) {
            for (let i = 0; i < filters['collectiontypes'].length; i++) {
              let colType = filters['collectiontypes'][i]
              if (colType.name == '2' || colType.name == '4') {
                delete colType.count
              }
            }
            // If auth.isPublicOnly 'unaffiliated' user, filter out all but type 5 collection type
            if (this._auth.isPublicOnly())
              filters['collectiontypes'] = filters['collectiontypes'].filter(collectionType => collectionType.name === "5")
          }

          this.availableFilters = filters;
        }
      )
    );
    // Subscribe to all applied filters in case something fires outside this component
    this.subscriptions.push(
      this._filters.applied$
            .subscribe(filters => {
                this.appliedFilters = filters;
            })
    );

  }

  private loadRoute() {
    let params = {};
    let currentParams = this.route.snapshot.params

    // Maintain feature flags
    if (currentParams['featureFlag']) {
      params['featureFlag'] = currentParams['featureFlag']
    }

    if (this.availableFilters.dateObj && this.availableFilters.dateObj.modified == true && this.filterDate) {
      params['startDate'] = this.availableFilters.dateObj.earliest.date * (this.availableFilters.dateObj.earliest.era == 'BCE' ? -1 : 1);
      params['endDate'] = this.availableFilters.dateObj.latest.date * (this.availableFilters.dateObj.latest.era == 'BCE' ? -1 : 1);
    }

    for (let filter of this.appliedFilters) {
      if(filter.filterGroup == 'page'){
        params[filter.filterGroup] =  parseInt(filter.filterValue[0]);
      }
      else if(filter.filterGroup == 'size'){
        params[filter.filterGroup] =  parseInt(filter.filterValue[0]);
      }
      else if((filter.filterGroup != 'startDate') && (filter.filterGroup != 'endDate') && (filter.filterValue && filter.filterValue.length > 0)){
        // Arrays must be stringified, as angular router doesnt handle them well
        params[filter.filterGroup] =  Array.isArray(filter.filterValue) ? JSON.stringify(filter.filterValue) : filter.filterValue;
      }
    }

    this.angulartics.eventTrack.next({ action: "filteredSearch", properties: { category: "search", label: params } })

    if(params['page']){
      params['page'] = this.pagination.page
    }

    if(currentParams.colId || currentParams.catId){

      let baseParams = {}

      if(currentParams.name){
        baseParams['name'] = currentParams.name
      }
      if(currentParams.browseType){
        baseParams['browseType'] = currentParams.browseType
      }
      if(currentParams.size){
        baseParams['size'] = currentParams.size
      }
      if(currentParams.page){
        baseParams['page'] = currentParams.page
      }
      if(currentParams.sort){
        baseParams['sort'] = currentParams.sort
      }
      if(this._filters.searchWithin && currentParams.term){ // If searchWithin is checked, then include the term param as well
        baseParams['term'] = currentParams.term
      }

      let queryParams = Object.assign(baseParams, params)
      let colId = currentParams.colId ? currentParams.colId : currentParams.catId
      let route = currentParams.colId ? 'collection' : 'category'

      this.router.navigate( [ '/' + route, colId, queryParams ] )
    }
    else{
      this.router.navigate(['search', this.term ? this.term : "*", params])
    }

  }

  changeSortOpt(index, label) {
    this.activeSort.index = index;
    this.activeSort.label = label;
    this.pagination.page = 1;
    this.loadRoute();
  }

  /**
   * Get keys of Object as an array of strings
   * - Convenience function useful for ngFor loops
   * @param obj Any Object
   */
  keys(obj: any) : Array<string> {
    return (Object.keys(obj) && Object.keys(obj).length > 0) ? Object.keys(obj) : []
  }

  isArray(thing) : boolean {
    return Object.prototype.toString.call( thing ) === '[object Array]'
  }

  toggleEra(dateObj){
    if(dateObj.era == 'BCE'){
      dateObj.era = 'CE';
    }
    else{
      dateObj.era = 'BCE';
    }
  }

  toggleTree(geoFacet){
    if(geoFacet.expanded){
      geoFacet.expanded = false;
    }
    else{
      geoFacet.expanded = true;
    }

  }

  toggleFilter(value, group){
    if(this._filters.isApplied(group, value)){ // Remove Filter
      this._filters.remove(group, value);
    } else { // Add Filter
      this._filters.apply(group, value);
    }
    this.pagination.page = 1;

    this.loadRoute();
  }

  filterApplied(value, group){
    return this._filters.isApplied(group, value);
  }

  clearAllFilterGroup(group){
    if(group == 'date'){
      this.availableFilters.dateObj.modified = false;
    }
    else{
      for(var i = 0; i < this.appliedFilters.length; i++){
        var filter = this.appliedFilters[i];
        if(filter.filterGroup === group){
          this.appliedFilters.splice(i, 1);
          i = -1;
        }
      }
    }

    this.pagination.page = 1;

    this.loadRoute();
  }

  // To check if a filter group has any applied filters
  hasAppliedFilters(group): boolean {
    let hasFilters: boolean = false;

    if(group == 'date'){
      hasFilters = this.availableFilters.dateObj.modified;
    }
    else{
      for(var i = 0; i < this.appliedFilters.length; i++){
        var filter = this.appliedFilters[i];
        if(filter.filterGroup === group){
          hasFilters = true;
          break;
        }
      }
    }
    return hasFilters;
  }

  clearDateFilter() {
    this.availableFilters.dateObj.modified = false;
    this.availableFilters.dateObj.earliest.date = this.availableFilters.prevDateObj.earliest.date;
    this.availableFilters.dateObj.earliest.era = this.availableFilters.prevDateObj.earliest.era;

    this.availableFilters.dateObj.latest.date = this.availableFilters.prevDateObj.latest.date;
    this.availableFilters.dateObj.latest.era = this.availableFilters.prevDateObj.latest.era;
    // this._filters.generateDateFacets();
  }

  removeFilter(filterObj){
    this._filters.remove(filterObj.filterGroup, filterObj.filterValue);
  }

  getUniqueColTypeIds(facetArray){
    var colTypeIds = [];
    for(var i = 0; i < facetArray.length; i++){
      var facetObj = facetArray[i];
      var idArray = facetObj.collectionType.split(',');
      for(var j = 0; j < idArray.length; j++){
        idArray[j] = idArray[j].trim();
        if(colTypeIds.indexOf(idArray[j]) === -1){
          colTypeIds.push(idArray[j]);
        }
      }
    }
    return colTypeIds;
  }


  applyDateFilter(){
    var sdate = parseInt(this.availableFilters.dateObj.earliest.date);
    sdate = this.availableFilters.dateObj.earliest.era == 'BCE' ? (sdate * -1) : sdate;

    var edate = parseInt(this.availableFilters.dateObj.latest.date);
    edate = this.availableFilters.dateObj.latest.era == 'BCE' ? (edate * -1) : edate;

    // Show error message if Start date is greater than End date
    if(sdate > edate){
      this.dateError = true;
      return;
    }
    else{
      this.dateError = false;
    }

    this.availableFilters.dateObj.modified = true;
    this.filterDate = true;
    this.pagination.page = 1;
    this.loadRoute();
  }

  existsInRegion(countryId, childerenIds){
    var result = false;
    for(var i = 0; i < childerenIds.length; i++){
      var child = childerenIds[i];
      if(child._reference == countryId){
        result = true;
        break;
      }
    }
    return result;
  }

  private dateKeyPress(event: any): boolean{
      if((event.key == 'ArrowUp') || (event.key == 'ArrowDown') || (event.key == 'ArrowRight') || (event.key == 'ArrowLeft') || (event.key == 'Backspace')){
        return true;
      }

      var theEvent = event || window.event;
      var key = theEvent.keyCode || theEvent.which;
      key = String.fromCharCode( key );
      var regex = /[0-9]|\./;
      if( !regex.test(key) ) {
        theEvent.returnValue = false;
        if(theEvent.preventDefault) theEvent.preventDefault();
      }

      return theEvent.returnValue;
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

}
