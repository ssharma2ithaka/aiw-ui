import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { AssetService, AuthService, ImageGroup } from './../../shared';

@Component({
  selector: 'ang-ig-download-modal',
  templateUrl: 'ig-download-modal.component.html',
  styles: [`
    .modal {
      display: block;
    }
  `]
})
export class PptModalComponent implements OnInit {
  /** Meant only to trigger display of modal */
  @Output()
  private closeModal: EventEmitter<any> = new EventEmitter();
  @Input()
  private ig: ImageGroup;

  private isLoading: boolean = false;
  private downloadLink: string = '';
  private downloadTitle: string = 'Image Group'

  private header = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' }); 
  private defaultOptions = new RequestOptions({ withCredentials: true});
  // private defaultOptions = new RequestOptions({ headers: this.header, withCredentials: true});

  constructor(private _assets: AssetService, private _auth: AuthService, private http: Http) { }

  ngOnInit() {
    this.isLoading = true;
    this.getDownloadLink(this.ig)
      .take(1)
      .subscribe(
        (data) => { 
          this.isLoading = false; 
          // Goal: A downlink that looks like:
          // http://library.artstor.org/thumb/imgstor/pptx/80664bd7-361e-4075-b832-aedfad9788c9/public_des.pptx?userid=706217&igid=873256
          if (data.path) {
            this.downloadLink = '//stage3.artstor.org' + data.path.replace('/nas/','/thumb/');
          }
        },
        (error) => { console.log(error); this.isLoading = false; }
      );

    
    
  }

  private getDownloadLink(group: ImageGroup): Observable<any> {
    let header = new Headers({ 'content-type': 'application/x-www-form-urlencoded' }); 
    let options = new RequestOptions({ headers: header, withCredentials: true});
    let imgStr: string = "";

    group.thumbnails.forEach((thumb, index, thumbs) => {
        imgStr += [(index + 1), thumb.objectId, "1024x1024"].join(":");
        if (index !== thumbs.length - 1) {
            imgStr += ",";
        }
    });

    let data = {
        _method: "createPPT",
        igId: group.igId,
        igName: group.igName,
        images: imgStr,
        zoom: '',
        zip: false
    }

    let encodedData: string = this._auth.formEncode(data);

    return this.http
      .post(this._auth.getUrl() + "/downloadpptimages", encodedData, options)
      .map(data => {
        return data.json() || {};
      });
  }

  // /** Gets the link at which the resource can be downloaded. Will be set to the "accept" button's download property */
  // private getDownloadLink(ig: ImageGroup): Observable<any> {
  //   let requestUrl = [this._auth.getUrl(), 'downloadpptimages'].join("/");

  //   // let imgStr: string = "";
  //   // ig.thumbnails.forEach((thumb, index, thumbs) => {
  //   //     imgStr += [(index + 1), thumb.objectId, "1024x1024"].join(":");
  //   //     if (index !== thumbs.length - 1) {
  //   //         imgStr += ",";
  //   //     }
  //   // });
  //   // console.log(imgStr);

  //   // let requestData = {
  //   //     _method: "createPPT",
  //   //     igId: ig.igId,
  //   //     igName: ig.igName,
  //   //     images: imgStr,
  //   //     zooms: null,
  //   //     zip: false
  //   // }
  //   // let requestData: any = {
  //   //   _method:"createPPT",
  //   //   igId:836667,
  //   //   igName:"Esto (5)",
  //   //   images:"1:ASTOLLERIG_10311329794:1024x1024,2:ASTOLLERIG_10311329786:1024x1024,3:ASTOLLERIG_10311329752:1024x1024,4:ASTOLLERIG_10311329769:1024x1024,5:ASTOLLERIG_10311329768:1024x1024",
  //   //   zoom: "",
  //   //   zip:"false"
  //   // }

  //   // var encodedString = '';
  //   // for (var key in requestData) {
  //   //     if (encodedString.length !== 0) {
  //   //         encodedString += '&';
  //   //     }
  //   //     encodedString += key + '=' + requestData[key];
  //   // }

  //   // // let encodedData: string = this._auth.formEncode(requestData);
  //   // console.log(encodedString);

  //   let data = "_method=createPPT&igId=836667&igName=Esto%20(5)&images=1%3AASTOLLERIG_10311329794%3A1024x1024%2C2%3AASTOLLERIG_10311329786%3A1024x1024%2C3%3AASTOLLERIG_10311329752%3A1024x1024%2C4%3AASTOLLERIG_10311329769%3A1024x1024%2C5%3AASTOLLERIG_10311329768%3A1024x1024&zoom=&zip=false";

  //   // let data = "_method=createPPT&igId=836667&igName=Esto (5)&images=1:ASTOLLERIG_10311329794:1024x1024,2:ASTOLLERIG_10311329786:1024x1024,3:ASTOLLERIG_10311329752:1024x1024,4:ASTOLLERIG_10311329769:1024x1024,5:ASTOLLERIG_10311329768:1024x1024&zoom=&zip=false";

  //   return this.http.post(requestUrl, data, this.defaultOptions);
  // }

  // private downloadStatusCall() {
  //   let statusParams: any = {
  //     // igId:877501,
  //     igId: 836667,
  //     pptExportAllowed:true,
  //     message:"PPTExportAllowed",
  //     pptDwnldDuration:120,
  //     userOrigPPTLimit:2000,
  //     userAllowedCnt:1995,
  //     userAlreadyDwnldImgCnt:5,
  //     igImgCount:5,
  //     nonPrivateImgCnt:5,
  //     pubAudioCnt:0,
  //     qtvrCnt:0,
  //     mediaCnt:0,
  //     zooms: "",
  //     canCache: "true",
  //     _method: "isExportToPPTAllowed"
  //   }

  //   // _method=isExportToPPTAllowed&igId=836667

  //   let endpoint = this._auth.getProxyUrl() +  "http://library.artstor.org/library/downloadPptImages_status.jsp?";
  //   let i = 0;
  //   for (let param in statusParams) {
  //     // if (i != Object.keys(statusParams).length) {
  //       endpoint += param + "=" + statusParams[param] + "&";
  //     // }
  //     i++;
  //   }
  //   endpoint = endpoint.substr(0, endpoint.length-1);
  //   console.log(endpoint);
  //   // return this.http.post(endpoint, "_method=isExportToPPTAllowed&igId=836667&zip=true", options);
  //   // return this.http.post(endpoint, "_method=isExportToPPTAllowed&igId=836667", this.defaultOptions);
  //   // return this.http.post(endpoint, statusParams, this.defaultOptions);
  //   return this.http.get(endpoint, this.defaultOptions);
  // }
}