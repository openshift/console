import { Injectable } from '@angular/core';
import { AbstractControl, Validators, Control, ControlGroup } from '@angular/common';
import { Http } from '@angular/http';
import { Router } from '@angular/router-deprecated';
import saveAs from '../adapters/file-saver';
import { Manifest, Wizard } from './models';
import { BaseField } from '../fields/models';
import { CaCertificateType } from '../fields/ca-certificate-field';
import { WizValidators, ValidatorFn } from '../validators/validators';
import { Helper } from '../helper/helper';

// TODO: load this by other means. Perhaps burn into html template.
const MANIFEST_URL = 'manifest';

@Injectable()
export class WizardService {
  // In-memory Wizard singleton. Persisted in this service across page views.
  private _wizard: Wizard;

  constructor(
    public http: Http,
    public router: Router,
    public helper: Helper
  ) { }

  private loadManifest(): Promise<Manifest> {
    return this.http.get(MANIFEST_URL).toPromise()
      .then(res => {
        return <Manifest>res.json();
      });
  }

  get wizard(): Wizard {
    return this._wizard;
  }

  initWizard(): Promise<void> {
    if (this._wizard) {
      return Promise.resolve();
    }

    return this.loadManifest()
      .then(manifest => {
        this._wizard = new Wizard(manifest);
        this._wizard.wizardControl = buildWizardControl(this._wizard);
      });
  }

  goToStep(step: number): Promise<void> {
    return this.router.navigate(['/Step', {stepNumber: step}]);
  }

  goToNextStep(): Promise<void> {
    return this.wizard.activeForm.onSubmit(this.http, this._wizard)
      .then(() => this.goToStep(this.wizard.nextFormIndex));
  }

  goToPreviousStep(): Promise<void> {
    return this.goToStep(this.wizard.previousFormIndex);
  }

  uploadConfiguration(file: File): Promise<void> {
    return this.helper.readFile(file)
      .then(JSON.parse)
      .then(value => updateWizardControlValue(this.wizard.wizardControl, value))
      .then(() => void(0));
  }

  downloadConfiguration() {
    // forms
    this.saveAs('tectonic.json', JSON.stringify(this.wizard.value, null, 2));

    // self-signed ca certificate (if desired)
    let caType: string = this.wizard.wizardControl.find(this.wizard.metadata.caCertificate.typeFrom).value;
    if (caType === CaCertificateType.SelfSigned) {
      this.saveAs('tectonic.crt', this.wizard.wizardControl.find(this.wizard.metadata.caCertificate.certificateFrom).value);
      this.saveAs('tectonic.key', this.wizard.wizardControl.find(this.wizard.metadata.caCertificate.privateKeyFrom).value);
    }
  }

  saveAs(fileName: string, value: string): void {
    let blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, fileName);
  }
}

// Iterate all forms in a Wizard and build up the ControlGroup for each.
function buildWizardControl(w: Wizard) {
  let controls: { [key: string]: AbstractControl } = {};

  w.forms.forEach(frm => {
    controls[frm.id] = frm.formControl = buildFormControl(frm.fields);
  });

  return new ControlGroup(controls);
}

// Builds an an Angular ControlGroup from an array of field objects.
function buildFormControl(fields: BaseField<any>[], validator?: ValidatorFn): ControlGroup {
  let controls: { [key: string]: AbstractControl } = {};

  fields.forEach(fld => {
    controls[fld.id] = buildFieldControl(fld);
  });

  return new ControlGroup(controls, null, validator);
}

// Build a single Control if the passed field is a simple field,
// otherwise returns a ControlGroup if any nested fields exist.
function buildFieldControl(fld: BaseField<any>): AbstractControl {
  let validator: ValidatorFn = buildValidator(fld);

  // Has nested fields
  if (fld.fields.length) {
    return buildFormControl(fld.fields, validator);
  }

  // Has no nested fields
  return new Control(fld.value, validator);
}

function buildValidator(fld: BaseField<any>): ValidatorFn {
  let validators: ValidatorFn[] = [];

  ((fld.validators || []) as any[]).forEach((nameOrFn: string | ValidatorFn) => {
    let validator: ValidatorFn = typeof nameOrFn === 'string' ? WizValidators.getByName(nameOrFn) : nameOrFn as ValidatorFn;
    if (validator) {
      validators.push(validator);
    }
  });

  return Validators.compose(validators);
}

function updateWizardControlValue(c: ControlGroup, v: any): void {
  if (v == null) {
    return;
  }

  Object.keys(c.controls).forEach(k => updateFormControlValue(c.controls[k] as ControlGroup, v[k]));
}

function updateFormControlValue(c: ControlGroup, v: any): void {
  if (v == null) {
    return;
  }

  Object.keys(c.controls).forEach(k => updateFieldControlValue(c.controls[k], v[k]));
}

function updateFieldControlValue(c: AbstractControl, v: any): void {
  if (v == null) {
    return;
  }

  if (c instanceof ControlGroup) {
    let cg: ControlGroup = c as ControlGroup;
    Object.keys(cg.controls).forEach(k => updateFieldControlValue(cg.controls[k], v[k]));
  } else {
    (c as Control).updateValue(v);
  }
}
