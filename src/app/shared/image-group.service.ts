import { Injectable, EventEmitter } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Router } from '@angular/router'

import { Observable, BehaviorSubject } from 'rxjs'

import { AuthService } from './../shared/auth.service'
import { ImageGroupDescription } from './../shared'

/**
 *
 * OLD SERVICE FOR GROUPS
 *
 * THIS SERVICE IS DEPRECATED
 *
 */

@Injectable()
export class ImageGroupService {
  private proxyUrl = '';
  private baseUrl: string;

  private header = new HttpHeaders().set('Content-Type', 'application/json'); // ... Set content type to JSON
  private options = { headers: this.header, withCredentials: true};

  private assetsValue: any[] = [];
  // BehaviorSubjects push last value on subscribe
  private assetsSource = new BehaviorSubject<any>(this.assetsValue);
  public assets = this.assetsSource.asObservable();

  public igDownloadTrigger: EventEmitter<any> = new EventEmitter();

  constructor(private _router: Router, private http: HttpClient, private _auth: AuthService ){
    this.baseUrl = this._auth.getUrl();
  }

  /**
   * Get image group description from image group id
   * @param groupId Id of desired image group
   * @returns JS Object with parameters: count, igId, igName, igNotes and more if it is a folder
   */
  getGroupDescription(groupId: string): Observable<ImageGroupDescription> {
    let requestUrl = [this.baseUrl, 'imagegroup', groupId].join('/') + '?_method=igdescription';

    return this.http
      .get<ImageGroupDescription>(requestUrl, this.options)
  }

  /**
   * Load image group assets
   * @param igId Image group id for which to retrieve assets
   * @param startIndex Starting index for the image group assets
   */
  loadIgAssets(igId: string, startIndex: number): void {
      let requestString: string = [this._auth.getUrl(), 'imagegroup', igId, 'thumbnails', startIndex, 72, 0].join('/');
      this.http
          .get(requestString, this.options)
          .toPromise()
          .then(
            (res) => {
                this.assetsSource.next(res);
          });
  }

  public triggerIgDownload(): void {
    this.igDownloadTrigger.emit();
  }

  public triggerIgExport(): void {
    console.log('triggerIgExport called!');
  }
}
