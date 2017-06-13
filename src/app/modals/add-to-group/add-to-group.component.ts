import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs/Rx';
import { CompleterService, CompleterData } from 'ng2-completer';

import { AssetService, GroupService, ImageGroup } from './../../shared';
import { AnalyticsService } from '../../analytics.service';

@Component({
  selector: 'ang-add-to-group',
  templateUrl: 'add-to-group.component.html'
})
export class AddToGroupModal implements OnInit, OnDestroy {
  @Output() closeModal: EventEmitter<any> = new EventEmitter();
  @Output() createGroup: EventEmitter<any> = new EventEmitter();
  @Input() showCreateGroup: boolean = false;
  private subscriptions: Subscription[] = [];

  @Input() private selectedAssets: any[] = []; // this is used in the asset page, where a single asset can be injected directly
  private groups: ImageGroup[] = [];
  private selectedIg: ImageGroup;
  private selectedGroupName: string;
  private selectedGroupError: string;

  @Input()
  private copySelectionStr: string = 'ADD_TO_GROUP_MODAL.FROM_SELECTED'

  private serviceResponse: {
    success?: boolean,
    failure?: boolean
  } = {};

  private dataService: CompleterData;

  constructor(
    private _assets: AssetService,
    private _group: GroupService,
    private _analytics: AnalyticsService,
    private completerService: CompleterService
  ) {
    
  }

  ngOnInit() {
    if (this.selectedAssets.length < 1) { // if no assets were added when component was initialized, the component gets the current selection list
      // Subscribe to asset selection
      this.subscriptions.push(
        this._assets.selection.subscribe(
          assets => {
            this.selectedAssets = assets;
          },
          error => {
            console.error(error);
          }
        )
      );
    }

    // Load list of Groups, and update autocomplete as Groups load
    this._group.getEveryGroup('private')
      .subscribe((groups) => { 
        if (groups) { 
          this.groups = groups;
          // Data service for the autocomplete component (ng2 completer)
          this.dataService = this.completerService.local(this.groups, 'name', 'name');
        } 
      }, (err) => { console.error(err); });
  }

  ngOnDestroy() {
      this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  /**
   * Submits updates to Group
   * @param form Values to update the group with
   */
  private submitGroupUpdate(form: NgForm) {
    // clear any service status
    this.serviceResponse = {}
    this.selectedGroupError = ''

    // Find full group object based on group name
    this.groups.forEach( (group, index) => {
      if (group.name == this.selectedGroupName) {
        this.selectedIg = group
      }
    })

    if (!this.selectedIg || this.selectedGroupName.length < 1) {
      this.selectedGroupError = "ADD_TO_GROUP_MODAL.NO_GROUP"
      return
    }
    
    // Create object for new modified group
    let putGroup: ImageGroup = Object.assign({}, this.selectedIg)

    // assets come from different places and sometimes have id and sometimes objectId
    this.selectedAssets.forEach((asset: any) => {
      if (asset && asset.id) {
        if (putGroup.items.indexOf(asset.id) < 0) {
          putGroup.items.push(asset.id);
        }
      } else if (asset && asset.objectId) {
        if (putGroup.items.indexOf(asset.objectId) < 0) {
          putGroup.items.push(asset.objectId);
        }
      }
    });

    this._analytics.directCall('save_selections_existing_img_group');

    this._group.get(this.selectedIg.id)
      .toPromise()
      .then((data) => { return this.extractData(data); })
      .then((data) => { 
        console.log(data);
        data.items = putGroup.items;

        this._group.update(data)
          .take(1)
          .subscribe(
            (res) => { this.serviceResponse.success = true; this._assets.clearSelectMode.next(true); },
            (err) => { console.error(err); this.serviceResponse.failure = true;
          })

      })
      .catch((error) => {
          console.error(error);
      });

    
  }

  private extractData(res: any) {
      let body = res.json();
      return body || { };
  }
}