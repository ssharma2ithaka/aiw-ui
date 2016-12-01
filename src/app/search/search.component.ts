import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { AppState } from '../app.service';

import { AssetService } from '../home/assets.service';

@Component({
  // The selector is what angular internally uses
  // for `document.querySelectorAll(selector)` in our index.html
  // where, in this case, selector is the string 'home'
  selector: 'search', 
  // We need to tell Angular's Dependency Injection which providers are in our app.
  providers: [
    AssetService
  ],
  // Our list of styles in our component. We may add more to compose many styles together
  styleUrls: [ './search.component.scss', './filters.component.scss' ],
  // Every Angular template is first compiled by the browser before Angular runs it's compiler
  templateUrl: './search.component.html'
})
export class Search {
  // Set our default values
  localState = { value: '' };
  errors = {};
  results = [];
  filters = [];
  collTypeFacets = [
    {
      id : '1',
      label: 'Artstor Digital Library'
    },
    {
      id : '5',
      label : 'Shared Shelf Commons' 
    }
  ];

  activeSort = {
    index : 0,
    label : 'Relevance'
  };
  term;
  sub;

  // TypeScript public modifiers
  constructor(public appState: AppState, private _assets: AssetService, private route: ActivatedRoute) {

  }

  ngOnInit() {
    console.log('hello `Search` component');
    let searchScope = this;

    this.route.params.map(params => params['term'])
            .subscribe(term => { 
                searchScope.term = term;
                searchScope.searchAssets(term);
               });
  }

  searchAssets(term) {
    let searchScope = this;
    this._assets.search(term, this.activeSort.index)
      .then(function(res){
        console.log(res);
        searchScope.results = res.thumbnails;
      })
      .catch(function(err) {
        searchScope.errors['search'] = "Unable to load search.";
      });
  }

  changeSortOpt(index, label) {
    this.activeSort.index = index;
    this.activeSort.label = label; 
    this.searchAssets(this.term);
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
    console.log(this.filters);
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
      for(var j = 0; j < idArray.length; i++){
        if(colTypeIds.indexOf(idArray[j]) === -1){
          colTypeIds.push(idArray[j]);
        }
      }
    }
  }

  submitState(value: string) {
    console.log('submitState', value);
    this.appState.set('value', value);
    this.localState.value = '';
  }
}
