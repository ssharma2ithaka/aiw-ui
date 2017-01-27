import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

import { Asset } from './asset';
import { AuthService, AssetService } from './../shared';

@Component({
    selector: 'ang-asset-page',
    templateUrl: 'asset-page.component.html',
    styleUrls: [ './asset-page.component.scss' ]
})
export class AssetPage implements OnInit, OnDestroy {

    private user: any;

    // Array to support multiple viewers on the page
    private assets: Asset[] = [];
    private assetIndex: number = 0;
    private assetNumber: number = 0;
    private totalAssetCount: number = 1;
    private subscriptions: Subscription[] = [];
    private prevAssetResults: any = { thumbnails : [] };
    private loadArrayFirstAsset: boolean = false;
    private loadArrayLastAsset: boolean = false;
    private isFullscreen: boolean = false;
    private showAssetDrawer: boolean = false;

    /** controls whether or not the modals are visible */
    private showAgreeModal: boolean = false;
    private showLoginModal: boolean = false;

    private copyURLStatusMsg: string = '';
    private generatedImgURL: string = '';
    

    constructor(private _assets: AssetService, private _auth: AuthService, private route: ActivatedRoute, private _router: Router) { }

    ngOnInit() {
        this.user = this._auth.getUser();

        this.subscriptions.push(
            this.route.params.subscribe((routeParams) => {
                if (this.assets[0]) {
                    this.assets.splice(0);
                }
                this.assets[0] = new Asset(routeParams["assetId"], this._assets, this._auth);

                if(this.prevAssetResults.thumbnails){
                    this.totalAssetCount = this.prevAssetResults.count ? this.prevAssetResults.count : this.prevAssetResults.thumbnails.length;
                    this.assetIndex = this.currentAssetIndex();
                    this.assetNumber = this._assets.lastSearchParams.currentPage ? this.assetIndex + 1 + ((this._assets.lastSearchParams.currentPage - 1) * this._assets.searchPageSize) : this.assetIndex + 1;
                }
            })
        );

        // sets up subscription to allResults, which is the service providing thumbnails
        this.subscriptions.push(
          this._assets.allResults.subscribe((allResults: any) => {
              if(allResults.thumbnails){
                  this.prevAssetResults = allResults;
                  if(this.loadArrayFirstAsset){
                      this.loadArrayFirstAsset = false;
                      if((this.prevAssetResults.thumbnails) && (this.prevAssetResults.thumbnails.length > 0)){
                          this._router.navigate(['/asset', this.prevAssetResults.thumbnails[0].objectId]);
                      }
                  }
                  else if(this.loadArrayLastAsset){
                      this.loadArrayLastAsset = false;
                      if((this.prevAssetResults.thumbnails) && (this.prevAssetResults.thumbnails.length > 0)){
                          this._router.navigate(['/asset', this.prevAssetResults.thumbnails[this.prevAssetResults.thumbnails.length - 1].objectId]);
                      }
                  }
                  else{
                    this.totalAssetCount = this.prevAssetResults.count ? this.prevAssetResults.count : this.prevAssetResults.thumbnails.length;
                    this.assetIndex = this.currentAssetIndex();
                    this.assetNumber = this._assets.lastSearchParams.currentPage ? this.assetIndex + 1 + ((this._assets.lastSearchParams.currentPage - 1) * this._assets.searchPageSize) : this.assetIndex + 1;
                  }
              }
          })
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
    }

    /**
     * Maintains the isFullscreen variable, as set by child AssetViewers
     */
    updateFullscreenVar(isFullscreen: boolean): void {
        console.log(isFullscreen);
        this.isFullscreen = isFullscreen;
    }

    /**
     * Find out if the user has accepted the agreement during this session
     * @returns boolean which is true if the user has accepted the agreement
     */
    private downloadAuth(): boolean {
        return this._auth.downloadAuthorized();
    }

    // Calculate the index of current asset from the previous assets result set
    private currentAssetIndex(): number{
        for(var i = 0; i < this.prevAssetResults.thumbnails.length; i++){
            if(this.prevAssetResults.thumbnails[i].objectId == this.assets[0].id){
                return i;
            }
        }
        return 1;
    }
    
    private showPrevAsset(): void{
        if(this.assetNumber > 1){
            if((this.assetIndex > 0)){
                this._router.navigate(['/asset', this.prevAssetResults.thumbnails[this.assetIndex - 1].objectId]);
            }
            else if(this.assetIndex == 0){
                this.loadArrayLastAsset = true;
                this._assets.loadPrevAssetPage();
            }
        }
    }

    private showNextAsset(): void{
        if(this.assetNumber < this.totalAssetCount){
            if((this.prevAssetResults.thumbnails) && (this.assetIndex < (this.prevAssetResults.thumbnails.length - 1))){
                this._router.navigate(['/asset', this.prevAssetResults.thumbnails[this.assetIndex + 1].objectId]);
            }
            else if((this.prevAssetResults.thumbnails) && (this.assetIndex == (this.prevAssetResults.thumbnails.length - 1))){
                this.loadArrayFirstAsset = true;
                this._assets.loadNextAssetPage();
            }
        }
    }

     /** 
     * Clean up the field label for use as an ID (used in testing)
     */
    private cleanId(label: string): string {
        return label.toLowerCase().replace(/\s/g,'');
    }

    private generateImgURL(): void{
        console.log(this.assets[0]);
        this._assets.genrateImageURL( this.assets[0].id )
          .then((imgURLData) => {
              this._assets.encryptuserId()
                .then((userEncryptData) => {
                  var imgEncryptId = imgURLData.encryptId;
                  var usrEncryptId = userEncryptData.encryptId;
                  this.generatedImgURL = this._auth.getUrl() + '/ViewImages?id=' + imgEncryptId + '&userId=' + usrEncryptId + '&zoomparams=&fs=true';
                  
                  this.copyTextToClipBoard();
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

    private copyTextToClipBoard(): void{
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

        var element = document.getElementById('generatedImgURL');
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

            this.copyURLStatusMsg = msg;
                setTimeout(() => {
                    this.copyURLStatusMsg = '';
                }, 8000);
        } catch (err) {
            console.log('Unable to copy');
        }

        document.body.removeChild(textArea);
    }
}