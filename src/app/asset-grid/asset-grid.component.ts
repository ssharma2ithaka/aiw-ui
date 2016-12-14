import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { Subscription }   from 'rxjs/Subscription';

import { AssetService } from '../home/assets.service';
import { AssetFiltersService } from '../asset-filters/asset-filters.service';

@Component({
  // The selector is what angular internally uses
  // for `document.querySelectorAll(selector)` in our index.html
  // where, in this case, selector is the string 'home'
  selector: 'ang-asset-grid', 
  // We need to tell Angular's Dependency Injection which providers are in our app.
  providers: [
    AssetService
  ],
  // Our list of styles in our component. We may add more to compose many styles together
  styleUrls: [ './asset-grid.component.scss' ],
  // Every Angular template is first compiled by the browser before Angular runs it's compiler
  templateUrl: './asset-grid.component.html'
})

export class AssetGrid implements OnInit, OnDestroy {
  // Set our default values
  private subscriptions: Subscription[] = [];

  public searchLoading: boolean;
  public showFilters: boolean = true;
  public showAdvancedModal: boolean = false;
  errors = {};
  results = [];
  filters = [];
  collTypeFacets = [];
  classificationFacets = [];
  geoTree = [];
  geographyFacets = [];
  dateFacetsArray = [];
  dateFacet = {
    earliest : {
      date : 1000,
      era : 'BCE'
    },
    latest : {
      date : 2016,
      era : 'CE'
    },
    modified : false
  };
  
  pagination = {
    currentPage : 1,
    totalPages : 1,
    pageSize : 24
  };
  activeSort = {
    index : 0,
    label : 'Relevance'
  };
  term;
  sub;
  // TO-DO: Fields should be pulled dynamically!
  public fields = [
    {name: 'Title' },
    {name: 'Creator' },
    {name: 'Location' },
    {name: 'Repository' }
  ];
  public geographyFields = [
    {name: 'North America'},
    {name: 'Central America and the Caribbean'},
    {name: 'South America'},
    {name: 'Europe'},
    {name: 'Africa North of the Sahara'},
    {name: 'Sub-Saharan Africa'}
  ];

  public advQueryTemplate = { term: '' };

  public advanceQueries = [
    { term: ''},
    { term: ''}
  ];

  // TypeScript public modifiers
  constructor(
    private _assets: AssetService,
    private _filters: AssetFiltersService, 
    private route: ActivatedRoute
  ) {
      
  } 

  ngOnInit() {
    console.log('hello `Search` component');
    // let scope = this;
    this.getTermsList();
// .map(params => params)
    this.subscriptions.push(
      this.route.params
      .subscribe((params: Params) => { 
        console.log(params);
        
        if (params['startDate'] && params['endDate']) {
          this.dateFacet.earliest.date = Math.abs(params['startDate']);
          this.dateFacet.latest.date = Math.abs(params['endDate']);

          if (params['startDate'] < 0) {
            this.dateFacet.earliest.era = "BCE";
          } else {
            this.dateFacet.earliest.era = "CE";
          }
          if (params['endDate'] < 0) {
            this.dateFacet.latest.era = "BCE";
          } else {
            this.dateFacet.latest.era = "CE";
          }

          this._filters.setFacets('dateObj', this.dateFacet);
        }

        for (let param in params) {
          if (param == 'term') {
            this.term = params[param];
          } else if (param == 'igId') {
            this.loadIgAssets(params[param]);
          } else {
            // Otherwise, it is a filter!
            this.toggleFilter(param, params[param]);
          }
        }
        this.searchAssets(this.term);
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  getTermsList(){
    let scope = this;
    this._assets.termList()
      .then(function(res){
        scope.geoTree = res.geoTree;
        // console.log(scope);
      })
      .catch(function(err) {
        console.log('Unable to load terms list.');
      });
  }

  searchAssets(term) {
    if (!term && this.results === []) {
      let term = "*";
    }
    let scope = this;
    this.searchLoading = true;

    this._assets.search(term, this.filters, this.activeSort.index, this.pagination, this.dateFacet)
      .then(
        data => {
          console.log(data);
          this.generateColTypeFacets( this.getUniqueColTypeIds(data.collTypeFacets) );
          this.generateGeoFacets( data.geographyFacets );
          this.generateDateFacets( data.dateFacets );
          this._filters.setFacets('classification', data.classificationFacets);
          this.setTotalPages(data.count);
          this.results = data.thumbnails;
          this.searchLoading = false;
        },
        error => {
          this.errors['search'] = "Unable to load search.";
          this.searchLoading = false;
        })
      .catch(function(err) {
        this.errors['search'] = "Unable to load search.";
        this.searchLoading = false;
      });
  }

  loadIgAssets(igId: string) {
    this._assets.getFromIgId(igId)
      .then((data) => {
        if (!data) {
          throw new Error("No data in image group thumbnails response");
        }
        this.results = data.thumbnails;
      })
      .catch((error) => {
        console.log(error);
      });
  }

  setTotalPages(count){
    this.pagination.totalPages = Math.ceil( count / this.pagination.pageSize );
  }


  isfirstPage(){
    if(this.pagination.currentPage === 1){
      return true;
    }
    else{
      return false;
    }
  }
  isLastPage(){
    if(this.pagination.currentPage === this.pagination.totalPages){
      return true;
    }
    else{
      return false;
    }
  }

  firstPage(){
    if(this.pagination.currentPage > 1){
      this.pagination.currentPage = 1;
      this.searchAssets(this.term);
    }
  }
  lastPage(){
    if(this.pagination.currentPage < this.pagination.totalPages){
      this.pagination.currentPage = this.pagination.totalPages;
      this.searchAssets(this.term);
    }
  }
  prevPage(){
    if(this.pagination.currentPage > 1){
      this.pagination.currentPage--;
      this.searchAssets(this.term);
    }
  }
  nextPage(){
    if(this.pagination.currentPage < this.pagination.totalPages){
      this.pagination.currentPage++;
      this.searchAssets(this.term);
    }
  }

  changeSortOpt(index, label) {
    this.activeSort.index = index;
    this.activeSort.label = label; 
    this.pagination.currentPage = 1;
    this.searchAssets(this.term);
  }

  changePageSize(size){
    this.pagination.pageSize = size;
    this.pagination.currentPage = 1;
    this.searchAssets(this.term);
  }

  currentPageOnblurr(){
    this.searchAssets(this.term);
  }

  toggleEra(dateObj){
    if(dateObj.era == 'BCE'){
      dateObj.era = 'CE';
    }
    else{
      dateObj.era = 'BCE';
    }
  }

  toggleFilter(value, group){
    var filter = {
      filterGroup : group,
      filterValue : value
    };
    if(this.filterExists(filter)){ // Remove Filter
      this.removeFilter(filter);
    }
    else{ // Add Filter
      this.filters.push(filter);
    }
    
    console.log('Applied Filters:-');
    console.log(this.filters);

    this.pagination.currentPage = 1;
    this.searchAssets(this.term);
  }

  filterApplied(value, group){
    var filter = {
      filterGroup : group,
      filterValue : value
    };
    if(this.filterExists(filter)){
      return true;
    }
    else{
      return false;
    }
  }

  clearAllFilterGroup(group){
    if(group == 'date'){
      this.dateFacet.modified = false;
    }
    else{
      for(var i = 0; i < this.filters.length; i++){
        var filter = this.filters[i];
        if(filter.filterGroup === group){
          this.filters.splice(i, 1);
          i = -1;
        }
      }
    }
    
    this.pagination.currentPage = 1;
    this.searchAssets(this.term);
  }

  removeFilter(filterObj){
    for(var i = 0; i < this.filters.length; i++){
      var filter = this.filters[i];
      if((filterObj.filterGroup === filter.filterGroup) && (filterObj.filterValue === filter.filterValue)){
        this.filters.splice(i, 1);
        break;
      }
    }
  }
  
  filterExists(filterObj){
    for(var i = 0; i < this.filters.length; i++){
      var filter = this.filters[i];
      if((filterObj.filterGroup === filter.filterGroup) && (filterObj.filterValue === filter.filterValue)){
        return true;
      }
    }
    return false;
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

  generateColTypeFacets(idsArray){
    var generatedFacetsArray = [];
    for(var i = 0; i < idsArray.length; i++){
      var facetObj = {
        id : idsArray[i],
        label: ''
      };
      if(facetObj.id === '1'){
        facetObj.label = 'Artstor Digital Library';
      }
      else if(facetObj.id === '5'){
        facetObj.label = 'Shared Shelf Commons';
      }
      generatedFacetsArray.push(facetObj);
    }
    
    this.collTypeFacets = generatedFacetsArray;
    this._filters.setFacets('collType', generatedFacetsArray); 
  }

  generateGeoFacets(resGeoFacetsArray){
    var generatedGeoFacets = [];
    var countriesArray = [];
    // Extract Regions
    for(var i = 0; i < resGeoFacetsArray.length; i++){
      var resGeoFacet = resGeoFacetsArray[i];
      var match = false;

      for(var j = 0; j < this.geoTree.length; j++){
        var geoTreeObj = this.geoTree[j];
        if((geoTreeObj.type == 'region') && (resGeoFacet.id == geoTreeObj.nodeId)){
          resGeoFacet.expanded = false;
          resGeoFacet.childrenIds = geoTreeObj.children;
          resGeoFacet.children = [];
          match = true;
          break;
        }
      }

      if(match){
          generatedGeoFacets.push(resGeoFacet);
      }
      else{
          countriesArray.push(resGeoFacet);
      }

    }

    // console.log(countriesArray);

    // Extract Countries
    for(var i = 0; i < countriesArray.length; i++){
      var country = countriesArray[i];

      for(var j = 0; j < generatedGeoFacets.length; j++){
        var generatedGeoFacet = generatedGeoFacets[j];
        if(this.existsInRegion(country.id, generatedGeoFacet.childrenIds)){
          // country.parentId = generatedGeoFacet.id;
          generatedGeoFacet.children.push(country);
          break;
        }
      }

    }


    this._filters.setFacets('geography', generatedGeoFacets);
    this.geographyFacets = generatedGeoFacets;
  }

  generateDateFacets(dateFacetsArray){
    var startDate = dateFacetsArray[0].date;
    var endDate = dateFacetsArray[dateFacetsArray.length - 1].date;
    
    this.dateFacet.earliest.date = Math.abs(startDate);
    this.dateFacet.earliest.era = startDate < 0 ? "BCE" : "CE";

    this.dateFacet.latest.date = Math.abs(endDate);
    this.dateFacet.latest.era = endDate < 0 ? "BCE" : "CE";

    this.dateFacet.modified = false;

    this._filters.setFacets('date', dateFacetsArray);
    this._filters.setFacets('dateObj', this.dateFacet);
    this.dateFacetsArray = dateFacetsArray;
  }

  applyDateFilter(){
    this.dateFacet.modified = true;

    this.pagination.currentPage = 1;
    this.searchAssets(this.term);
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


}
