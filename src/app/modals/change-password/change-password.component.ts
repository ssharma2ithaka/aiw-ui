import { Component, OnInit, Output, EventEmitter } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { AuthService } from '../../shared'

@Component({
  selector: 'ang-change-password-modal',
  templateUrl: 'change-password.component.pug'
})

export class ChangePasswordModal implements OnInit {

  @Output() closeModal: EventEmitter<any> = new EventEmitter()

  private passForm: FormGroup
  private serviceResponses: {
    success?: boolean,
    wrongPass?: boolean,
    generalError?: boolean
  } = {};
  private submitted: boolean = false
  private changePassLoading: boolean = false

  constructor(
    private _auth: AuthService,
    _fb: FormBuilder
  ) {
    this.passForm = _fb.group({
      oldPass: [null, Validators.required],
      newPass: [null, Validators.compose([Validators.required, Validators.minLength(7)])],
      newPassConfirm: [null, Validators.required]
    }, { validator: this.passwordsEqual })
  }

  ngOnInit() { }

  submit() {

  }

  /** Validates that the passwords are equal and assigns error if not
   * @returns error to FormGroup called 'mismatch' if the passwords are not equal
   */
  private passwordsEqual(group: FormGroup): any {
    return group.get('newPass').value === group.get('newPassConfirm').value
      ? null : { passwordMismatch: true };
  }

  private changePass(formValue: any): void {
    this.submitted = true;
    this.serviceResponses = {};

    // don't call the service if the form isn't valid
    if ( !this.passForm.valid ) { return; }

    this.changePassLoading = true;

    this._auth.changePassword(formValue.oldPass, formValue.newPass)
      .take(1)
      .subscribe((res) => {
        this.changePassLoading = false;

        switch (res.statusCode) {
          case 0: this.serviceResponses.success = true; break;
          case 6: this.serviceResponses.wrongPass = true; break;
          default: this.serviceResponses.generalError = true;
        }

      }, (err) => {
        this.changePassLoading = false;
        this.serviceResponses.generalError = true;
        console.error(err);
      });
  }
}