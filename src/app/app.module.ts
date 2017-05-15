import { NgModule, ApplicationRef } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Http, HttpModule } from '@angular/http';
import { RouterModule, RouteReuseStrategy } from '@angular/router';
import { removeNgStyles, createNewHosts, createInputTransfer } from '@angularclass/hmr';

/*
 * Platform and Environment providers/directives/pipes
 */
import { ENV_PROVIDERS } from './environment';
import { ROUTES } from './app.routes';

// UI modules
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
// import { CoolStorageModule } from 'angular2-cool-storage';
import {LockerModule, Locker, LockerConfig} from 'angular2-locker'
import { Angulartics2Module, Angulartics2GoogleAnalytics } from 'angulartics2';
import { TranslateModule, TranslateStaticLoader, TranslateLoader } from 'ng2-translate';
import { RlTagInputModule } from 'angular2-tag-input';

// Directives
import { ClickOutsideDirective } from 'angular2-click-outside/clickOutside.directive.ts';
import { MediumEditorDirective } from 'angular2-medium-editor/medium-editor.directive.ts';

// ng2-idle
import { NgIdleKeepaliveModule } from '@ng-idle/keepalive'; // this includes the core NgIdleModule but includes keepalive providers for easy wireup
import { MomentModule } from 'angular2-moment'; // optional, provides moment-style pipes for date formatting
import {DndModule} from 'ng2-dnd';

// App is our top level component
import { App } from './app.component';
import { APP_RESOLVER_PROVIDERS } from './app.resolver';
import { AppState, InternalStateType } from './app.service';
import { Nav, Footer, SearchComponent, PaginationComponent } from './shared';
import { NavMenu } from './nav-menu';
import { AssetFilters } from './asset-filters';
import { AssetGrid, ThumbnailComponent } from './asset-grid';
import { Home } from './home';
import { SearchPage } from './search-page';
import { CollectionPage } from './collection-page';
import { CategoryPage } from './category-page';
import { ImageGroupPPPage } from './image-group-pp-page';
import { ClusterPage } from './cluster-page';
import { BrowsePage, LibraryComponent, BrowseCommonsComponent,
  MyCollectionsComponent, BrowseInstitutionComponent, BrowseGroupsComponent, TagComponent } from './browse-page';
import { AssetPage, AgreeModalComponent } from './asset-page';
import { AssetViewerComponent } from './asset-page/asset-viewer';
import { AccountPage } from './account-page';
import { AssociatedPage } from './associated-page';
import { ImageGroupPage, PptModalComponent } from './image-group-page';
import { Login } from './login';
import { NoContent } from './no-content';
import { RegisterComponent } from './register/register.component';
import { 
  LoginReqModal, 
  SearchModal, 
  NewIgModal, 
  ShareLinkModal, 
  DownloadLimitModal, 
  AddToGroupModal, 
  DeleteIgModal, 
  NoIgModal, 
  AccessDeniedModal, 
  ShareIgLinkModal, 
  ConfirmModal 
} from './modals';
import { SkyBannerComponent } from './sky-banner/sky-banner.component'


// Application wide providers
import { AuthService, AssetService, GroupService, TypeIdPipe, ToolboxService, LoggingService, ImageGroupService } from './shared';
import { AssetFiltersService } from './asset-filters/asset-filters.service';
import { TagsService } from './browse-page/tags.service';
import { CustomReuseStrategy } from './reuse-strategy';
import { LegacyRouteResolver } from './legacy.service'

const APP_PROVIDERS = [
  ...APP_RESOLVER_PROVIDERS,
  AppState,
  AssetService,
  GroupService,
  AuthService,
  ImageGroupService,
  AssetFiltersService,
  TagsService,
  ToolboxService,
  LoggingService,
  LegacyRouteResolver
  // { provide: RouteReuseStrategy, useClass: CustomReuseStrategy } // to be implemented later
];

type StoreType = {
  state: InternalStateType,
  restoreInputValues: () => void,
  disposeOldHosts: () => void
};

/**
 * `AppModule` is the main entry point into Angular2's bootstraping process
 */
@NgModule({
  bootstrap: [ App ],
  declarations: [
    App,
    Nav,
    NavMenu,
    Footer,
    SearchPage,
    CollectionPage,
    CategoryPage,
    ImageGroupPPPage,
    ClickOutsideDirective,
    DownloadLimitModal,
    ShareIgLinkModal,
    ConfirmModal,
    SkyBannerComponent,
    DeleteIgModal,
    NoIgModal,
    ClusterPage,
    BrowsePage,
    TagComponent,
    AccountPage,
    AssetViewerComponent,
    AssetPage,
    AgreeModalComponent,
    LibraryComponent,
    BrowseCommonsComponent,
    MyCollectionsComponent,
    BrowseInstitutionComponent,
    BrowseGroupsComponent,
    AssociatedPage,
    AssetFilters,
    PaginationComponent,
    AccessDeniedModal,
    AssetGrid,
    SearchComponent,
    ThumbnailComponent,
    ImageGroupPage,
    PptModalComponent,
    LoginReqModal,
    SearchModal,
    NewIgModal,
    ShareLinkModal,
    Login,
    Home,
    NoContent,
    TypeIdPipe,
    AddToGroupModal,
    MediumEditorDirective,
    RegisterComponent
  ],
  imports: [ // import Angular's modules
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    RlTagInputModule,
    // CoolStorageModule,
    LockerModule,
    RouterModule.forRoot(ROUTES, { useHash: true }),
    Angulartics2Module.forRoot([ Angulartics2GoogleAnalytics ]),
    TranslateModule.forRoot({
        provide: TranslateLoader,
        useFactory: (http: Http) => new TranslateStaticLoader(http, '/assets/i18n', '.json'),
        deps: [Http]
    }),
    NgbModule.forRoot(), // Ng Bootstrap Import
    NgIdleKeepaliveModule.forRoot(),
    DndModule.forRoot() // Drag n Drop import
  ],
  providers: [ // expose our Services and Providers into Angular's dependency injection
    ENV_PROVIDERS,
    APP_PROVIDERS
  ]
})
export class AppModule {
  constructor(public appRef: ApplicationRef, public appState: AppState) {}

  hmrOnInit(store: StoreType) {
    if (!store || !store.state) return;
    console.log('HMR store', JSON.stringify(store, null, 2));
    // set state
    this.appState._state = store.state;
    // set input values
    if ('restoreInputValues' in store) {
      let restoreInputValues = store.restoreInputValues;
      setTimeout(restoreInputValues);
    }

    this.appRef.tick();
    delete store.state;
    delete store.restoreInputValues;
  }

  hmrOnDestroy(store: StoreType) {
    const cmpLocation = this.appRef.components.map(cmp => cmp.location.nativeElement);
    // save state
    const state = this.appState._state;
    store.state = state;
    // recreate root elements
    store.disposeOldHosts = createNewHosts(cmpLocation);
    // save input values
    store.restoreInputValues  = createInputTransfer();
    // remove styles
    removeNgStyles();
  }

  hmrAfterDestroy(store: StoreType) {
    // display new elements
    store.disposeOldHosts();
    delete store.disposeOldHosts;
  }

}

