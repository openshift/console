import { AfterViewInit, Component, ElementRef, OnInit, Input, ViewChild } from '@angular/core';
import { ControlGroup, Control, AbstractControl } from '@angular/common';
import { IdentityEmailField } from '../models';
import { JSONValidator } from '../../validators/validators';
import { WizValidationErrorComponent } from '../../validators/validation-error';
import { UploadFileComponent } from '../../upload-file/upload-file.component';
import { Helper } from '../../helper/helper';

@Component({
  selector: 'wiz-identity-email-field',
  templateUrl: 'app/static/src/fields/components/identity-email.html',
  directives: [
    JSONValidator,
    UploadFileComponent,
    WizValidationErrorComponent,
  ],
  providers: [Helper],
})
export class IdentityEmailFieldComponent implements OnInit {
  @Input() fieldModel: IdentityEmailField;
  @Input() control: AbstractControl;
  @Input() autofocus: boolean;
  @ViewChild('focusElement') focusElement: ElementRef;

  mailSystem: string = 'smtp';

  configDefaults = {
    mailgun: {
      "type": "mailgun",
      "privateAPIKey": "key-XXX",
      "publicAPIKey": "YYY",
      "domain": "exampleZZZ.mailgun.org"
    },
    smtp: {
      "type": "smtp",
      "host": "smtp.example.com",
      "port": 587,
      "auth": "plain",
      "username": "postmaster@example.com",
      "password": "12345"
    }
  }

  constructor(private _helper: Helper) {}

  ngOnInit() {
    this.populateDefaultConfig(this.mailSystem);
  }

  ngAfterViewInit() {
    if (this.autofocus) {
      this._helper.focus(this.focusElement);
    }
  }

  populateDefaultConfig(system: string): void {
    let jsonVal = this.configDefaults[system];
    let prettyString = JSON.stringify(jsonVal, null, 2);
    (<Control>this.control).updateValue(prettyString);
  }

}
