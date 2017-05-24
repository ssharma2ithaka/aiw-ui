import { Injectable } from '@angular/core';

// Reference to imported Adobe script in index.html
declare var _satellite: any;
// Reference Adobe page layer object
declare var DDO: any;
// <!--Adobe Analytics: Page level "Data Layer"-->
//   <script type="text/javascript" class="ddo">
// var  DDO = { pageData : {} };
// DDO.pageData= {
//     pageInfo:{
//     pageName:"value",
//     pageID:"value"
//     },
//     user:{
//     userInstitution: "value"
//     }
// };
    // </script>
interface DataLayer {
    pageInfo:{
        pageName: string,
        pageID: string
    },
    user:{
        userInstitution: string
    }
}


@Injectable()
export class AnalyticsService {
    public pageData: DataLayer;

    constructor() { 
        this.pageData = DDO.pageData;
    }
    
    public directCall(eventName: string) {
        try {
            _satellite && _satellite.track && _satellite.track(eventName);
        } catch(error) {
            console.error(error)
        }   
    }

    public setPageName(name: string) {
        this.pageData.pageInfo.pageName = name
    }

    /**
     * Set an ID value relevant to the content of the page (eg. Asset ID, Collection ID)
     */
    public setPageID(id: string) {
        this.pageData.pageInfo.pageID = id
    }

    /** 
     * Set logged in user's institution
     */
    public setUserInstitution(institution: string) {
        this.pageData.user.userInstitution = institution
    }

    /**
     * Clear all values from Adobe pageData object
     */
    public clearPageData() {
        this.setPageID('')
        this.setPageName('')
        this.setUserInstitution('')
    }

    /**
     * Set Page values on navigating to a new page
     */
    public setPageValues(name: string, id: string) {
        this.setPageID(id)
        this.setPageName(name)
    }
}