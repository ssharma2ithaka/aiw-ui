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
  private zipLoading: boolean = false;
  private downloadLink: string = '';
  private zipDownloadLink: string = '';
  private downloadTitle: string = 'Image Group';
  private allowedDownloads: number = 0;
  private imgCount: number = 0;

  private header = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' }); 
  private defaultOptions = new RequestOptions({ withCredentials: true});
  // private defaultOptions = new RequestOptions({ headers: this.header, withCredentials: true});

  constructor(private _assets: AssetService, private _auth: AuthService, private http: Http) { }

  ngOnInit() {
    this.isLoading = true;
    this.zipLoading = true;
    console.log(this.ig);

    // Setup PPT Download
    this.getDownloadLink(this.ig)
      .take(1)
      .subscribe(
        (data) => { 
          this.isLoading = false; 
          // Goal: A downlink that looks like:
          // http://mdxdv.artstor.org/thumb/imgstor/...
          if (data.path) {
            this.downloadLink = this._auth.getThumbUrl() + data.path.replace('/nas/','/thumb/');
          }
        },
        (error) => { console.error(error); this.isLoading = false; }
      );
    
    // Setup Zip download
    this.getDownloadLink(this.ig, true)
      .take(1)
      .subscribe(
        (data) => { 
          this.zipLoading = false;
          // Goal: A downlink that looks like:
          // http://mdxdv.artstor.org/thumb/imgstor/...
          if (data.path) {
            this.zipDownloadLink = this._auth.getThumbUrl() + data.path.replace('/nas/','/thumb/');
          }
        },
        (error) => { console.error(error); this.zipLoading = false; }
      );
  }

  /** Gets the link at which the resource can be downloaded. Will be set to the "accept" button's download property */
  private getDownloadLink(group: ImageGroup, zip ?: boolean): Observable<any> {
    let header = new Headers({ 'content-type': 'application/x-www-form-urlencoded' })
    let options = new RequestOptions({ headers: header, withCredentials: true})
    let imgStr: string = ""
    let data : any
    let url : string

    group.items.forEach((item, index, items) => {
        imgStr += [(index + 1), item, "1024x1024"].join(":")
        if (index !== items.length - 1) {
            imgStr += ","
        }
    })

    data = {
        igId: group.id,
        igName: group.name,
        images: imgStr
    }

    url = this._auth.getHostname() + '/api/group/export'

    // Make authorization call to increment download count
    this.http
      .get(url + '/auth/' + group.id + '/true', options)
      .map(data => {
        return data.json() || {};
      })
      .toPromise()

    if (zip) { 
      url += "/zip"
      // To deprecate
      data["_method"] = "createZip"
    } else {
      url += "/pptx"
      // To deprecate
      data["_method"] = "createPPTX"
    }
    
    return this.http
      .post(url, data, options)
      .map(data => {
        return data.json() || {};
      });
  }

}