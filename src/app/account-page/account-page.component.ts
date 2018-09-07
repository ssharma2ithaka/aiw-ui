import { Subscription } from 'rxjs/Rx'
import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'

// Project Dependencies
import { AuthService, AccountService } from '../shared'
import { FormBuilder, FormGroup } from '@angular/forms'
import { USER_ROLES, USER_DEPTS, UserRolesAndDepts } from './../register/user-roles'

@Component({
  selector: 'app-account-page',
  templateUrl: './account-page.component.pug',
  styleUrls: ['./account-page.component.scss']
})
export class AccountPage implements OnInit {
  private user: any = {};
  private institutionObj: any = {};
  private subscriptions: Subscription[] = [];

  private showChangePassModal: boolean = false
  private accountUpdateForm: FormGroup

  // ui display controls
  private updateLoading: boolean = false
  private messages: {
    updateSuccess?: boolean,
    updateError?: boolean
  } = {}

  // update form select field values
  private userDepts: UserRolesAndDepts[] = []
  private userRoles: UserRolesAndDepts[] = []

  constructor(
    private _account: AccountService,
    private _auth: AuthService,
    private _router: Router,
    _fb: FormBuilder
  ) {
    this.user = this._auth.getUser()

    this.accountUpdateForm = _fb.group({
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      dept: null,
      role: null
    })
  }

  ngOnInit() {
    if (!this.user.isLoggedIn) {
      this._router.navigate(['/home'])
    }

    this.subscriptions.push(
      this._auth.getInstitution().subscribe((institutionObj) => {
        this.institutionObj = institutionObj
      })
    )

    // Issues with unauthorized access to the service, and the fact that the data NEVER changes, led us to hardcode these values:
    this.userDepts = USER_DEPTS
    this.userRoles = USER_ROLES
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe() });
  }

  submitAccountUpdate(form: FormGroup): void {
    this.messages = {}
    if (!form.valid) { return } // I don't think this would actually get hit, but it's here just in case

    this.updateLoading = true

    // get a copy of the current user value, modify it in memory, send it in the update, and then save it back to local storage
    let updateUser = this._auth.getUser()
    Object.assign(updateUser, form.value)
    this._account.update(updateUser)
    .take(1)
    .subscribe((res) => {
      this.updateLoading = false
      this._auth.saveUser(updateUser)
      this.messages.updateSuccess = true
    }, (err) => {
      this.updateLoading = false
      console.error(err)
      this.messages.updateError = true
    })
  }

}
