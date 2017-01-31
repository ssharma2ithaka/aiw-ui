import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { Subscription }   from 'rxjs/Subscription';

import { AssetService } from '../shared/assets.service';
import { AssetFiltersService } from '../asset-filters/asset-filters.service';
import { AuthService } from '../shared/auth.service';
import { Thumbnail } from './../shared';

@Component({
  // The selector is what angular internally uses
  // for `document.querySelectorAll(selector)` in our index.html
  // where, in this case, selector is the string 'home'
  selector: 'ang-asset-grid', 
  // We need to tell Angular's Dependency Injection which providers are in our app.
  providers: [],
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
  private results: Thumbnail[] = [];
  filters = [];
  private editMode: boolean = false;
  private selectedAssets: any[] = [];

  // Default show as loading until results have update
  private isLoading: boolean = true;

  private baseURL: string = '';
  private imgEncryptId: string = '';
  private usrEncryptId: string = '';
  private showgenImgURLModal: boolean = false;
  private genImgMode: string = 'half';
  private imgURLCopied: boolean = false;
  private copyURLStatusMsg: string = '';
  private copyHTMLStatusMsg: string = '';

  @Input()
  private assetCount: number;

  private pagination: any = {
    totalPages: 1,
    pageSize: 24,
    currentPage: 1
  };
  
  dateFacet = {
    earliest : {
      date : 1000,
      era : 'BCE'
    },
    latest : {
      date : 2017,
      era : 'CE'
    },
    modified : false
  };
  
  activeSort = {
    index : 0,
    label : 'Relevance'
  };
  sub;

  // Object Id parameter, for Clusters
  private objectId : string = ''; 
  // Collection Id parameter
  private colId : string = '';
  // Image group Id
  private igId : string = '';

  // TypeScript public modifiers
  constructor(
    private _assets: AssetService,
    private _filters: AssetFiltersService,
    private _auth:AuthService,
    private _router: Router,
    private route: ActivatedRoute
  ) {
      this.baseURL = this._auth.getUrl();
  } 

  ngOnInit() {
    this.subscriptions.push(
      this.route.params
      .subscribe((params: Params) => {

        for (let param in params) {
            // test if param is a special parameter
            if (this.pagination.hasOwnProperty(param)) {
                // param is a special parameter - assign the value
                this.pagination[param] = parseInt(params[param]);
            } else {
                // Any other filters are managed by Asset Filters
            }
        }
                
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

          this._filters.setAvailable('dateObj', this.dateFacet);
        }
        
        this.isLoading = true;
      })
    );

    // sets up subscription to allResults, which is the service providing thumbnails
    this.subscriptions.push(
      this._assets.allResults.subscribe((allResults: any) => {

        // this conditional because allResults from collections page does not have count of assets
        if (allResults.count) {
          this.pagination.totalPages = Math.ceil( allResults.count / this.pagination.pageSize );
        } else if (this.assetCount) {
          this.pagination.totalPages = Math.ceil( this.assetCount / this.pagination.pageSize );
        }

        // handles case when currentPage * pageSize > allResults.count
        if (allResults.count === 0 && this.pagination.currentPage > 1) {
          this.goToPage(1);
        } else {
          this.results = allResults.thumbnails;

          if (this.pagination.currentPage > this.pagination.totalPages) {
            this.goToPage(this.pagination.totalPages);
          }
        }
        if (allResults.length == 0) {
          // We push an empty array when assets are old
          this.isLoading = true;
        } else {
          this.isLoading = false;
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  /**
   * Set currentPage in url and navigate, which triggers this._assets.queryAll() again
   * @param currentPage number of desired page
   */
  private goToPage(currentPage: number) {
    // The requested page should be within the limits (i.e 1 to totalPages)
    if((currentPage >= 1) && (currentPage <= this.pagination.totalPages)){
      this.pagination.currentPage = currentPage;
      this.addRouteParam("currentPage", currentPage);
    }
  }

  /**
   * Change size of page and go to currentPage=1
   * @param pageSize Number of assets requested on page
   */
  private changePageSize(pageSize: number){
    this.pagination.pageSize = pageSize;
    //this currently calls naviage twice through addRouteParam
    this.goToPage(1);
    this.addRouteParam("pageSize", pageSize);
  }

  private changeSortOpt(index, label) {
    this.activeSort.index = index;
    this.activeSort.label = label; 
    this.pagination.currentPage = 1;
    
  }

  /**
   * Allows to input only numbers [1 - 9] 
   * @param event Event emitted on keypress inside the current page number field
   */
  private pageNumberKeyPress(event: any): boolean{
      if((event.key == 'ArrowUp') || (event.key == 'ArrowDown') || (event.key == 'ArrowRight') || (event.key == 'ArrowLeft') || (event.key == 'Backspace')){
        return true;
      }

      var theEvent = event || window.event;
      var key = theEvent.keyCode || theEvent.which;
      key = String.fromCharCode( key );
      var regex = /[1-9]|\./;
      if( !regex.test(key) ) {
        theEvent.returnValue = false;
        if(theEvent.preventDefault) theEvent.preventDefault();
      }

      return theEvent.returnValue;
  }

  /**
   * Generate Image URL for the selected image in Edit Mode 
   */
  public generateImgUrl(): void{
      if(this.selectedAssets.length > 0){
        this._assets.genrateImageURL( this.selectedAssets[0].objectId )
          .then((imgURLData) => {
              this._assets.encryptuserId()
                .then((userEncryptData) => {
                  this.imgEncryptId = imgURLData.encryptId;
                  this.usrEncryptId = userEncryptData.encryptId;
                  this.showgenImgURLModal = true;
                })
                .catch(function(err){
                  console.log('Unable to Encrypt userid');
                  console.error(err);
                });
          })
          .catch(function(err) {
              console.log('Unable to generate image URL');
              console.error(err);
          });
      }
      else{
        console.log('No Asset Selected!');
      }
  }


  /**
   * Edit Mode : Selects / deselects an asset - Inserts / Removes the asset object to the selectedAssets array 
   * @param asset object to be selected / deselected
   */
  private selectAsset(asset: any): void{
    if(this.editMode){
      let index: number = this.isSelectedAsset(asset);
      if(index > -1){
        this.selectedAssets.splice(index, 1);
      }
      else{
        this.selectedAssets.push(asset);
      }
    }
    console.log(this.selectedAssets);
  }

  /**
   * Edit Mode : Is the asset selected or not 
   * @param asset object whose selection / deselection is to be determined
   * @returns index if the asset is already selected, else returns -1
   */
  private isSelectedAsset(asset: any): number{
    let index: number = -1;
    for(var i = 0; i < this.selectedAssets.length; i++){
      if(this.selectedAssets[i].objectId === asset.objectId){
        index = i;
        break;
      }
    }
    return index;
  }

  /**
   * Adds a parameter to the route and navigates to new route
   * @param key Parameter you want added to route (as matrix param)
   * @param value The value of the parameter
   */
  private addRouteParam(key: string, value: any) {
    let currentParamsObj: Params = Object.assign({}, this.route.snapshot.params);
    currentParamsObj[key] = value;

    let term: string = '';
    let extractedParams = {};
    let scpObj = this;

    Object.keys(currentParamsObj).forEach(function(key) {
            if(key == 'term'){
                term = currentParamsObj[key];
            }
            else{
              if(key == 'currentPage'){
                extractedParams['pageSize'] = scpObj.pagination.pageSize;
              }
              extractedParams[key] = currentParamsObj[key];
            }
        });

    this._router.navigate([extractedParams], { relativeTo: this.route });
    // this._router.navigate(['/search', term, extractedParams]);
  }

  private convertCollectionTypes(collectionId: number) {
    switch (collectionId) {
      case 3:
        return "personal-asset";
    }
  }

  /**
   * Copies innerText of an element to the clipboard
   * @param id of the field whose innerText is to be copied to the clipboard
   */
  private copyTexttoClipBoard(id: string): void{
    var textArea = document.createElement("textarea");

    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';

    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';

    var element = document.getElementById(id);
    textArea.value = element.textContent;

    document.body.appendChild(textArea);
    textArea.select();

    try {
      var successful = document.execCommand('copy');
      var msg = '';
      
      if(successful){
        msg = 'Successfully Copied!';
      }
      else{
        msg = 'Not able to copy!';
      }

      if(id === 'copyURL'){
        this.copyURLStatusMsg = msg;
        setTimeout(() => {
          this.copyURLStatusMsg = '';
        }, 8000);
      }
      else if(id === 'copyHTML'){
        this.copyHTMLStatusMsg = msg;
        setTimeout(() => {
          this.copyHTMLStatusMsg = '';
        }, 8000);
      }
    } catch (err) {
      console.log('Unable to copy');
    }

    document.body.removeChild(textArea);
  }
}
