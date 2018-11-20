/*
 * Angular 2 decorators and services
 */
import { Component, ViewEncapsulation, PLATFORM_ID, Inject } from '@angular/core'
import { Angulartics2GoogleAnalytics } from 'angulartics2/ga'
import { Title, Meta } from '@angular/platform-browser'
import { Router, NavigationStart, NavigationEnd } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { map, take } from 'rxjs/operators'

import { AppConfig } from './app.service'
import { ScriptService, FlagService } from './shared'
import { isPlatformBrowser } from '@angular/common';
/*
 * App Component
 * Top Level Component
 */
@Component({
  selector: 'app',
  encapsulation: ViewEncapsulation.None,
  template: `
    <ang-sky-banner *ngIf="showSkyBanner" [textValue]="skyBannerCopy" (closeBanner)="showSkyBanner = false"></ang-sky-banner>
    <div>
      <div id="skip" tabindex="-1" aria-activedescendant="button">
        <button id="button" (click)="findMainContent()" (keyup.enter)="findMainContent()" tabindex="1" class="sr-only sr-only-focusable"> Skip to main content </button>
      </div>
      <nav-bar tabindex="-1"></nav-bar>
    </div>
    <main tabindex="-1">
      <router-outlet></router-outlet>
    </main>

    <footer>
    </footer>

  `
})
export class App {
  url = 'https://artstor.org/'
  title = 'Artstor'

  public showSkyBanner: boolean = false
  public skyBannerCopy: string = ''

  constructor(
    public _app: AppConfig,
    angulartics2GoogleAnalytics: Angulartics2GoogleAnalytics,
    private titleService: Title,
    private _script: ScriptService,
    private _flags: FlagService,
    private router: Router,
    private translate: TranslateService,
    private meta: Meta,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Start GA trackiong
    angulartics2GoogleAnalytics.startTracking()
    // append query param to dodge caching
    let langStr = 'en.json?no-cache=' + new Date().valueOf()
    // I'm hoping this sets these for the entire app
    // this language will be used as a fallback when a translation isn't found in the current language
    translate.setDefaultLang(langStr);
    // the lang to use, if the lang isn't available, it will use the current loader to get them
    translate.use(langStr);

    this.title = this._app.config.pageTitle


    // Adding meta OGP tags
    this.meta.addTags([
      { property: "og:title", content: "Artstor" },
      { property: "og:description", content: "The Artstor Digital Library is the most extensive image resource available for educational and scholarly use. Our collections feature visual media from leading museums, photo archives, scholars, and artists, offering many rare and important collections available nowhere else." },
      { property: "og:url", content: "https://library.artstor.org/" },
      { property: "og:image", content: "/assets/img/logo-v1-1.png" },
      { property: "og:type", content: "website" }
    ])

    // Set metatitle to "Artstor" except for asset page where metatitle is {{ Asset Title }}
    router.events.pipe(map(event => {
      if (event instanceof NavigationStart) {
        // Client-only code
        if (isPlatformBrowser(this.platformId)) {
          // focus on the wrapper of the "skip to main content link" everytime new page is loaded
          let mainEl = <HTMLElement>(document.getElementById('skip'))
          if (!(event.url.indexOf('browse') > -1)) // Don't set focus to skip to main content on browse pages so that we can easily go between browse levels
            mainEl.focus()

          // Detect featureflag=solrmetadata and set cookie
          let routeParams = event.url.split(';')
          for (let routeParam of routeParams) {
            let key = routeParam.split('=')[0]
            let value = routeParam.split('=')[1]
            if (key === 'featureFlag' && value === 'solrMetadata') {
              document.cookie = 'featureflag=solrmetadata;';
            }
          }
        }

        let event_url_array = event.url.split('/')
        if (event_url_array && (event_url_array.length > 1) && (event_url_array[1] !== 'asset')){
          this.titleService.setTitle(this.title)
        }
      }
      else if (event instanceof NavigationEnd) {
        let event_url_array = event.url.split('/')

        // Reset OGP tags with default values for every route other than asset and collection pages
        if(event.url.indexOf('asset/') === -1){
          this.resetOgpTags();
        }

        // Client-only code
        if (isPlatformBrowser(this.platformId)) {
          let zendeskElements = document.querySelectorAll('.zopim')
          // On navigation end, load the zendesk chat widget if user lands on login page else hide the widget
          if (this.showChatWidget(window.location.href) && this._app.config.showZendeskWidget) {
            this._script.loadScript('zendesk')
              .then( data => {
                if (data['status'] === 'loaded'){
                } else if (data['status'] === 'already_loaded'){ // if the widget script has already been loaded then just show the widget
                  zendeskElements[0]['style']['display'] = 'block'
                }
              })
              .catch( error => console.error(error) )
          } else {
            // If Zendesk chat is loaded, hide it
            if (zendeskElements && zendeskElements.length > 1) {
              zendeskElements[0]['style']['display'] = 'none'
              zendeskElements[1]['style']['display'] = 'none'
            }
          }
        }
      }
    })).subscribe()

    // TO-DO: Universal support for flags service
    // this._flags.getFlagsFromService().pipe(
    //   take(1),
    //   map(flags => {
    //     // don't need to handle successful response here - this just initiates the flags
    //     console.log(flags)
    //     // Set skybanner
    //     this.showSkyBanner = flags.bannerShow
    //     this.skyBannerCopy = flags.bannerCopy
    //   }, (err) => {
    //     console.error(err)
    // })).subscribe()
  }

  ngOnInit() {
    // Toggle Banner here to show alerts and updates!
    // this.showSkyBanner = true
  }

  private resetOgpTags(): void{
    this.meta.updateTag({ property: "og:title", content: "Artstor" }, 'property="og:title"')
    this.meta.updateTag({ property: "og:description", content: "The Artstor Digital Library is the most extensive image resource available for educational and scholarly use. Our collections feature visual media from leading museums, photo archives, scholars, and artists, offering many rare and important collections available nowhere else." }, 'property="og:description"')
    this.meta.updateTag({ property: "og:url", content: "https://library.artstor.org/" }, 'property="og:url"')
    this.meta.updateTag({ property: "og:image", content: "/assets/img/logo-v1-1.png" }, 'property="og:image"')
  }

  public findMainContent(): void {
    window.setTimeout(function ()
    {
      let htmlelement: HTMLElement = document.getElementById('mainContent');
      let element: Element;
      // On log in page, go to log in box
      if (htmlelement.querySelector('form div input')){
        element = htmlelement.querySelector('form div input');
      }
      // On any page that has search bar, go to search box
      else if (htmlelement.querySelector('div input')){
        element = htmlelement.querySelector('div input');
      }
      // On asset page, go to the container that contains the item details
      else {
        element = htmlelement;
      }
      (<HTMLElement>element).focus();
    }, 100);
  }

  // Show the chat widget on: 'login', 'browse/library', or 'browse/groups/public'
  private showChatWidget(eventUrl: string): boolean {
      if (eventUrl.indexOf('browse/library') > -1 ||
          eventUrl.indexOf('browse/groups/public') > -1 ||
          eventUrl.indexOf('login') > -1) {
           return true
        }
      else {
        return false
      }
  }
}
