import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs'
import { map } from 'rxjs/operators'

@Component({
  selector: 'ang-general-search',
  templateUrl: 'general-search.component.pug'
})

export class GeneralSearchComponent implements OnInit {
  @Output() executeSearch: EventEmitter<string> = new EventEmitter()
  @Input() updateSearchTerm: EventEmitter<string> = new EventEmitter() // allows an outside component to set the search term
  @Input() init: string = ''

  @Input() loadingGrps: boolean
  @Output() clearGrpSearch: EventEmitter<string> = new EventEmitter() // Invoke clear group search method in parent component

  // the term that will be searched for
  public term: string = ''
  public startSearch: boolean = false

  private subscriptions: Subscription[] = []

  constructor() { }

  ngOnInit() {
    if (this.init)
      this.term = this.init
    if (this.updateSearchTerm) {
      this.subscriptions.push(
        this.updateSearchTerm.pipe(
          map(term => {
          this.term = term
        })).subscribe()
      )
    }
  }

  public setFocus(): void {
    window.setTimeout(function () {
      if (document.getElementById('empty-search-alert')){
        document.getElementById('empty-search-alert').focus()
      }
    }, 110);
  }

}
