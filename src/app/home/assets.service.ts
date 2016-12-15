/**
 * Assets service
 */
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { Locker } from 'angular2-locker';

import 'rxjs/add/operator/toPromise';
 
import { AuthService } from '../shared/auth.service';

@Injectable()
export class AssetService {

    public _storage;

    constructor(private _router: Router, private http: Http, locker: Locker, private _auth: AuthService ){
        this._storage = locker;  
    }
    
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

    cluster(objectId, sortIndex, pagination) {
        let options = new RequestOptions({ withCredentials: true });
        let startIndex = ((pagination.currentPage - 1) * pagination.pageSize) + 1;

        return this.http
            .get(this._auth.getUrl() + '/cluster/' + objectId + '/thumbnails/' + startIndex + '/' + pagination.pageSize + '/' + sortIndex, options)
            .toPromise()
            .then(this.extractData);
    }

    /**
     * Get Collection
     * @param colId id of collection to fetch
     * @returns thumbnails of assets for a collection, and collection information
     */
    getCollection(colId) {
        let options = new RequestOptions({ withCredentials: true });

        return this.http
            .get(this._auth.getUrl() + '/collections/' + colId, options)
            .toPromise()
            .then(this.extractData);
    }

    getCollectionThumbs(colId: string, pageNo?: number, pageSize?: number) {
        ///87730739/thumbnails/1/72/0
        let options = new RequestOptions({withCredentials: true});
        let imageSize = 0;
        
        if (!pageNo) { pageNo = 1; }
        if (!pageSize) { pageSize = 72; }

        return this.http
            .get(this._auth.getUrl() + '/collections/' + colId + '/thumbnails/' + pageNo + '/' + pageSize + '/' + imageSize, options)
            .toPromise()
            .then(this.extractData);
    }   

    /**
     * Term List Service
     * @returns       Returns the Geo Tree Object used for generating the geofacets tree.
     */

    termList(){
        let options = new RequestOptions({ withCredentials: true });
        
        return this.http
            .get(this._auth.getUrl() + '/termslist/', options)
            .toPromise()
            .then(this.extractData);   
    }

    /**
     * Search assets service
     * @param term          String to search for.
     * @param filters       Array of filter objects (with filterGroup and filterValue properties)
     * @param sortIndex     An integer representing a type of sort.
     * @param pagination    Object with properties currentPage and pageSize
     * @param dateFacet     Object with the dateFacet values
     * @returns       Returns an object with the properties: thumbnails, count, altKey, classificationFacets, geographyFacets, minDate, maxDate, collTypeFacets, dateFacets
     */

    search(term, filters, sortIndex, pagination, dateFacet) {
        let keyword = encodeURIComponent(term);
        let options = new RequestOptions({ withCredentials: true });
        let startIndex = ((pagination.currentPage - 1) * pagination.pageSize) + 1;
        let thumbSize = 0;
        let type = 6;
        let colTypeIds = '';
        let classificationIds = '';
        let geographyIds = '';

        let earliestDate = '';
        let latestDate = '';

        if(dateFacet.modified){
            earliestDate = dateFacet.earliest.date;
            earliestDate = ( dateFacet.earliest.era == 'BCE' ) ? ( parseInt(earliestDate) * -1 ).toString() : earliestDate;

            latestDate = dateFacet.latest.date;
            latestDate = ( dateFacet.latest.era == 'BCE' ) ? ( parseInt(latestDate) * -1 ).toString() : latestDate;
        }

        for(var i = 0; i < filters.length; i++){ // Applied filters
            if(filters[i].filterGroup === 'collTypes'){ // Collection Types
                colTypeIds = filters[i].filterValue;
            }
            if(filters[i].filterGroup === 'classification'){ // Classification
                if(classificationIds != ''){
                    classificationIds += ',';
                }
                classificationIds += filters[i].filterValue;
            }
            if(filters[i].filterGroup === 'geography'){ // Geography
                if(geographyIds != ''){
                    geographyIds += ',';
                }
                geographyIds += filters[i].filterValue;
            }
        }
        // /search/1/{start_idx}/{page_size}/0?type= 1&kw={keyword}&origKW=&id={collection_ids}&name=All Collections&order={order}&tn={thumbnail_size}
        
        return this.http
            .get(this._auth.getUrl() + '/search/' + type + '/' + startIndex + '/' + pagination.pageSize + '/' + sortIndex + '?' + 'type=' + type + '&kw=' + keyword + '&origKW=&geoIds=' + geographyIds + '&clsIds=' + classificationIds + '&collTypes=' + colTypeIds + '&id=all&name=All%20Collections&bDate=' + earliestDate + '&eDate=' + latestDate + '&dExact=&order=0&isHistory=false&prGeoId=&tn=1', options)
            .toPromise()
            .then(this.extractData);
    }

    getCollections() {
        let options = new RequestOptions({ withCredentials: true });
        // Returns all of the collections names
        return this.http
            .get(this._auth.getUrl() + '/institutions/', options)
            .toPromise()
            .then(this.extractData);
    }

    /**
     * Gets thumbnails from image group Id
     * @param groupId Id of desired image group
     * @returns Promise, which is resolved with thumbnail data object
     */
    getFromIgId(groupId: string) {
        let header = new Headers({ 'Content-Type': 'application/json' }); // ... Set content type to JSON
        let options = new RequestOptions({ headers: header, withCredentials: true }); // Create a request option

        return this.http
            .get(this._auth.getUrl() + "/imagegroup/" + groupId + "/thumbnails", options)
            .toPromise()
            .then((data) => { return this.extractData(data); });
    }

    /**
     * Get associated images
     * @param objectId The id of the object for which you want associated items
     * @param colId The id of the collection from which the asset came
     * @param pageNum Value for pagination
     * @param pageSize How many thumbnails per page
     */
    getAssociated(objectId: string, colId: string, pageNum: number, pageSize: number) {
        let header = new Headers({ 'Content-Type': 'application/json' }); // ... Set content type to JSON
        let options = new RequestOptions({ headers: header, withCredentials: true }); // Create a request option
        let requestRoute: string = this._auth.getUrl() + "/" + ["collaboratoryfiltering", objectId, "thumbnails", pageNum, pageSize].join("/") + "?collectionId=" + colId;
        console.log(requestRoute);

        return this.http
            .get(requestRoute, options)
            .toPromise()
            .then((data) => { return this.extractData(data); });

        // http://library.artstor.org/library/secure/collaboratoryfiltering/SCALA_ARCHIVES_1039931976/thumbnails/1/72/0?collectionId=103
    }
 
 
}