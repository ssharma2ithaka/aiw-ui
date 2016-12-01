import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { Locker } from 'angular2-locker';

import 'rxjs/add/operator/toPromise';
 
@Injectable()
export class AssetService {

    public _storage;

    constructor(private _router: Router, private http: Http, locker: Locker ){
        this._storage = locker;  
    }
    
    // Use header rewrite proxy for local development
    private proxyUrl = 'http://rocky-cliffs-9470.herokuapp.com/api?url=';
     // private instance var for base url
    private baseUrl = this.proxyUrl + 'http://library.artstor.org/library/secure';
    
    private formEncode = function (obj) {
            var encodedString = '';
            for (var key in obj) {
                if (encodedString.length !== 0) {
                    encodedString += '&';
                }

                encodedString += key + '=' + encodeURIComponent(obj[key]);
            }
            return encodedString.replace(/%20/g, '+');
        };
    
    private extractData(res: Response) {
        let body = res.json();
        return body || { };
    }

    search(term, filters, sortIndex) {
        let keyword = encodeURIComponent(term);
        let options = new RequestOptions({ withCredentials: true });
        let pageNo = 1;
        let pagesize = 48;
        let thumbSize = 0;
        let type = 6;
        let colTypeIds = '';

        for(var i = 0; i < filters.length; i++){ // Applied filters
            if(filters[i].filterGroup === 'collTypes'){ // Collection Types
                colTypeIds = filters[i].filterValue;
            }
        }
        // /search/1/{start_idx}/{page_size}/0?type= 1&kw={keyword}&origKW=&id={collection_ids}&name=All Collections&order={order}&tn={thumbnail_size}
        
        return this.http
            .get(this.baseUrl + '/search/' + type + '/' + pageNo + '/' + pagesize + '/' + sortIndex + '?' + 'type=' + type + '&kw=' + keyword + '&origKW=&geoIds=&clsIds=&collTypes=' + colTypeIds + '&id=all&name=All%20Collections&bDate=&eDate=&dExact=&order=0&isHistory=false&prGeoId=&tn=1', options)
            .toPromise()
            .then(this.extractData);
    }

    getCollections() {
        let options = new RequestOptions({ withCredentials: true });
        // Returns all of the collections names
        return this.http
            .get(this.baseUrl + '/institutions/', options)
            .toPromise()
            .then(this.extractData);
    }
    
    // login(user: User) {
    //     var header = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' }); // ... Set content type to JSON
    //     let options = new RequestOptions({ headers: header, withCredentials: true }); // Create a request option
    //     var data = this.formEncode({ 
    //             'j_username': user.username, 
    //             'j_password': user.password 
    //         });

    //     return this.http
    //         .post(this.baseUrl + '/login', data, options)
    //         .toPromise()
    //         .then(this.extractData)
    //         .catch(function() {
    //             // error handling
    //         });

    // }
 
 
}