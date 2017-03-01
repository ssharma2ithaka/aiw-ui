import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { LoginService } from '../../login/login.service';
import { AuthService, ToolboxService } from '..';

import {Idle, DEFAULT_INTERRUPTSOURCES} from '@ng-idle/core';
import {Keepalive} from '@ng-idle/keepalive';

@Component({
  selector: 'nav-bar',
  providers: [
    LoginService
  ],
  templateUrl: './nav.component.html',
  styleUrls: [ './nav.component.scss' ],
})
export class Nav implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  public showLoginPanel = false;
  private user: any;
  private institutionObj: any;
  private _tool: ToolboxService = new ToolboxService();
  private showinactiveUserLogoutModal: boolean = false;
  private idleState: string = 'Not started.';

  // TypeScript public modifiers
  constructor(private _auth: AuthService, private _login: LoginService, private _router:Router, private route: ActivatedRoute, private location: Location, private idle: Idle, private keepalive: Keepalive) {  
    idle.setIdle(60);
    idle.setTimeout(3600);
    idle.setInterrupts(DEFAULT_INTERRUPTSOURCES);

    idle.onIdleEnd.subscribe(() => {
      this.idleState = 'No longer idle.';
      console.log(this.idleState);
    });
    idle.onTimeout.subscribe(() => {
      if(this.user && this.user.isLoggedIn){
        this.logout();
        this.showinactiveUserLogoutModal = true;

        this.idleState = 'Timed out!';
        console.log(this.idleState);
      }
      else{
        this.resetIdleWatcher()
      }
    });
    idle.onIdleStart.subscribe(() => {
      this.idleState = 'You\'ve gone idle!';
      console.log(this.idleState);
    });
    idle.onTimeoutWarning.subscribe((countdown) => {
      this.idleState = 'You will time out in ' + countdown + ' seconds!'
      // console.log(this.idleState);
    });

    this.resetIdleWatcher();
  }

  ngOnInit() {

    this.subscriptions.push(
      this._router.events.subscribe(e => {
        if (e instanceof NavigationEnd && (e.url != '/login') && (e.url.split('/')[1] != 'printpreview')) {
            this.showLoginPanel = true;
          } else {
            this.showLoginPanel = false;
          }
        this.user = this._auth.getUser();
      })
    );

    this.subscriptions.push(
      this._auth.getInstitution().subscribe((institutionObj) => {
        this.institutionObj = institutionObj;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  logout(): void {
    this._login.logout();
  }

  navigateAndSaveRoute(route: string): void {
    this._auth.store("stashedRoute", this.location.path(false));

    this._router.navigate([route]);
  }

  // Reset the idle watcher
  resetIdleWatcher() {
    this.idle.watch();
    this.idleState = 'Idle watcher started'
    console.log(this.idleState);
  }

  // Reset the idle watcher and navigate to remote login page
  inactiveUsrLogOut(): void{
    this.resetIdleWatcher();
    this.showinactiveUserLogoutModal = false;
  }
  
} 
