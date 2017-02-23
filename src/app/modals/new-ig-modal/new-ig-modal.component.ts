import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { formGroupNameProvider } from '@angular/forms/src/directives/reactive_directives/form_group_name';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';

import { AuthService } from './../../shared';

@Component({
  selector: 'ang-new-ig-modal',
  templateUrl: 'new-ig-modal.component.html'
})
export class NewIgModal implements OnInit {
  @Output() closeModal: EventEmitter<any> = new EventEmitter();

  private newIgForm: FormGroup;
  private isArtstorUser: boolean = false;
  private tags: string[] = [];
  // We need to seed the medium editor with an empty div to fix line return issues in Firefox!
  private igDescription: string = "<div>&nbsp;</div>";

  private isLoading: boolean = false;
  private submitted: boolean = false;

  constructor(private _auth: AuthService, _fb: FormBuilder) {
    this.newIgForm = _fb.group({
      title: [null, Validators.required],
      artstorPermissions: [this.isArtstorUser ? "private" : null],
      public: [null],
      tags: [this.tags]
    })
  }

  ngOnInit() {
    this.isArtstorUser = this._auth.getUser().institutionId == 24615;
  }

  private igFormSubmit(formValue: any): void {
    this.submitted = true;

    // avoid making the service calls, but still trigger error display
    if (!this.newIgForm.valid) {
      return;
    }

    // anything after here will run if the form is valid

    console.log(formValue);
    console.log(this.igDescription); // the description is not technically part of the form
  }
}