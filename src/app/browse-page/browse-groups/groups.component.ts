import { Title } from '@angular/platform-browser'
import { Component, OnInit } from '@angular/core'
import { Router, ActivatedRoute, Params, NavigationEnd } from '@angular/router'
import { Subscription }   from 'rxjs/Subscription'

import { AssetService, AuthService, GroupService } from './../../shared'
import { AnalyticsService } from './../../analytics.service'
import { Tag } from './../tag'
import { TagFiltersService } from './tag-filters.service'

@Component({
  selector: 'ang-browse-groups',
  templateUrl: 'groups.component.html',
  styleUrls: [ './../browse-page.component.scss' ]
})
export class BrowseGroupsComponent implements OnInit {
  constructor(
    private _router: Router,
    private _assets: AssetService,
    private _groups: GroupService,
    private _tagFilters: TagFiltersService,
    private _auth: AuthService,
    private _analytics: AnalyticsService,
    private _title: Title,
    private route: ActivatedRoute
  ) { }

  private subscriptions: Subscription[] = []

  private userTypeId: any
  private currentBrowseRes: any = {}
  private tags: Tag[] = []
  private loading: boolean = true

  private pagination: {
    totalPages: number,
    pageSize: number,
    currentPage: number
  } = {
    totalPages: 1,
    pageSize: 48,
    currentPage: 1
  }

  private tagFilters = []
  private appliedTags: string[] = []

  private selectedBrowseLevel: string = 'public'
  private browseMenuArray: { label: string, level: string, selected ?: boolean }[] = []

  // when the user first clicks the search tab, we set this to true because we don't want to trigger a general search - it's checked before searching groups
  private firstSearch: boolean = false

  private errorObj: any = {}
  
  ngOnInit() {
    // set the title
    this._title.setTitle("Artstor | Browse Groups")

    this.subscriptions.push(
      this.route.params.subscribe((params) => {
        if (params.view !== (this.selectedBrowseLevel || 'search')) {
          this.appliedTags = []
          this.selectedBrowseLevel = params.view
        }

          this.loadIGs(this.appliedTags, 1, this.selectedBrowseLevel, this.route.snapshot.queryParams.term)
      })
    )

    /** Every time the url updates, we process the new tags and reload image groups if the tags query param changes */
    this.subscriptions.push(
      this.route.queryParams.subscribe((query) => {
        if (query.tags) {
          this.appliedTags = this._tagFilters.processFilterString(query.tags)
        } else {
          this.appliedTags = []
        }

        let requestedPage = Number(query.page) || 1
        if (requestedPage < 1) { return this.goToPage(1) } // STOP THEM if they're trying to enter a negative number
        let requestedLevel = query.level || 'public'
        this.setSearchLevel(query.level)

        this.loadIGs(this.appliedTags, requestedPage, requestedLevel, query.term)
      })
    )
    
    /** Here, we push in all of the options for different browse levels the user has access to */
    if (this._auth.getUser() && this._auth.getUser().isLoggedIn) {
      this.browseMenuArray.push({
        label: 'Private',
        level: 'private'
      })
    }

    this.browseMenuArray.push({
      label: 'Institutional',
      level: 'institution'
    })
    
    this.browseMenuArray.push({
      label: 'Artstor Curated',
      level: 'public'
    })

    if (this._auth.getUser() && this._auth.getUser().isLoggedIn) {
      this.browseMenuArray.push({
        label: 'Shared with Me',
        level: 'shared'
      })
    }

    // Mary has edits before we reveal Search
    this.browseMenuArray.push({
      label: 'Search',
      level: 'search'
    })

    // // set up the initially selected search level
    // let selectedSearchLevel = this.route.snapshot.queryParams.level
    // if (selectedSearchLevel) {
    //   this.browseMenuArray.forEach((filter) => {
    //     if (filter.level === selectedSearchLevel) {
    //       return filter.selected = true
    //     }
    //   })
    // }

    this.setSearchLevel(this.route.snapshot.queryParams.level)

    this.loadIGs(this.appliedTags, this.pagination.currentPage, this.selectedBrowseLevel)
  
    this._analytics.setPageValues('groups', '')
  } // OnInit

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe() })
  }

  /**
   * Makes sure that only one search filter can be selected (may change later if we can add multiple levels to search)
   * @param level The level param you want to search groups with
   */
  private setSearchLevel(level: string): void {
    this.browseMenuArray.forEach((filter) => {
      if (filter.level !== level) {
        filter.selected = false
      } else {
        filter.selected = true
      }
    })

    level && this.addQueryParams({ level: level })
  }

  /**
   * Getter for the selected search level
   * @returns The currently selected search level, defaulted to 'all
   */
  private getSearchLevel(): string {
    // return undefined if search isn't even selected
    if (this.route.snapshot.params.view !== 'search') {
      return
    }

    let selectedLevel: string
    this.browseMenuArray.forEach((filter) => {
      if (filter.selected) {
        selectedLevel = filter.level
      }
    })
    return selectedLevel || 'all' // default to 'all'
  }

  /**
   * Turns the groups into a ui-usable Tag, which doesn't make logical sense but it's how it works
   * @param folderArray An array of groups returned by the services
   */
  private createGroupTags(folderArray): Tag[] {
    let childArr: Tag[] = []
    let parentTag = null

    for(let group of folderArray) {
            let groupTag = new Tag(group.id, [group.name, ' (', group.items.length, ')'].join(""), true, null, { label: "group", folder: false }, true)
            childArr.push(groupTag)
          }
    return childArr
  }
  
  /**
   * Loads Image Groups data for the current user in the array
   * @param appliedTags The array of tags which the user has selected to filter by
   * @param page The desired page number to navigate to
   * @param level The query param for the groups call that indicates what share permissions the user has
   */
  private loadIGs(appliedTags: string[], page: number, level?: string, searchTerm ?: string): void {
    // this makes sure we don't search as soon as the user clicks the search tab, and also triggers some display items on search
    // we actually want to stop the search if there's not a keyword or a selected filter/level. those will come from the url
    if (appliedTags.length === 0 && level === 'search' && !searchTerm) {
      this.firstSearch = false
      this._tagFilters.setFilters([], [])
      this.tags = []
      this.errorObj["search"] = ""
      this.loading = false
      return
    }
    
    this.loading = true
    let browseLevel: string

    // if level is not provided explicitly, here is some logic for determining what it should be - search takes priority, then browse level, default to 'public'
    if (level === 'search') {
      browseLevel = this.getSearchLevel()
    } else if (!level) {
      browseLevel = this.getSearchLevel() || this.selectedBrowseLevel || 'public'
    } else {
      browseLevel = level
    }

    this._groups.getAll(browseLevel, this.pagination.pageSize, page, appliedTags, searchTerm)
        .take(1).subscribe(
          (data)  => {
            this.pagination.currentPage = page
            this.pagination.totalPages = Math.ceil(data.total/this.pagination.pageSize) // update pagination, which is injected into pagination component
            if (this.pagination.currentPage > this.pagination.totalPages && data.total > 0) {
              return this.goToPage(this.pagination.totalPages) // go to the last results page if they try to navigate to a page that is more than results
            }
            this._tagFilters.setFilters(data.tags, appliedTags) // give the tag service the new data
            this.tags = this.createGroupTags(data.groups) // save the image groups for display
            this.loading = false

            console.log(data.total, level)
            // show them the search error
            if (data.total === 0 && this.route.snapshot.params.view === 'search') {
              this.errorObj['search'] = 'No search results found'
            }
          },
          (error) => {
            this._tagFilters.setFilters([], appliedTags)
            this.tags = []
            this.errorObj[browseLevel] = "Sorry, we were unable to load these Image Groups"
            this.loading = false
          }
        )
  }

  /**
   * Gets the image groups for a new page - applies all currently applied filters, just updates the page number
   * @param newPageNum The page number you wish to navigate to
   */
  private goToPage(newPageNum: number) {
    this.addQueryParams({ page: newPageNum })
  }

  private addQueryParams(params: { [key: string]: any }, reset?: boolean) {

    let queryParams
    if (reset) {
      queryParams = params
    } else {
      queryParams = Object.assign(Object.assign({}, this.route.snapshot.params.queryParams), params)
    }

    this._router.navigate(['/browse','groups', this.selectedBrowseLevel], { queryParams: queryParams })
  }
}