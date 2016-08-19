import {
  Component,
} from '@angular/core';

import {
  DynamicFieldComponent,
} from './dynamic-field.component';

import {
  ErrorService,
} from '../error/error.service';

import {
  WizardService,
} from './wizard.service';

import {
  WizForm,
} from './models';

@Component({
  selector: 'wiz-form-step',
  templateUrl: 'app/static/src/wizard/form-step.component.html',
  directives: [DynamicFieldComponent],
})
export class FormStepComponent {
  isGoToNextStepInProgress: boolean;
  isGoToPreviousStepInProgress: boolean;

  constructor(
    public errorService: ErrorService,
    public wizardService: WizardService
  ) { }

  get wizForm(): WizForm {
    return this.wizardService.wizard.activeForm;
  }

  get isNextStepDisabled(): boolean {
    let isActiveFormValid: boolean = this.wizardService.wizard.activeForm.isValid(this.wizardService.wizard);
    return this.isGoToNextStepInProgress || !isActiveFormValid;
  }

  get isPreviousStepDisabled(): boolean {
    return this.isGoToPreviousStepInProgress;
  }

  onNextStepClick(): void {
    if (this.isGoToNextStepInProgress) {
      return;
    }

    this.isGoToNextStepInProgress = true;
    this.wizardService.goToNextStep()
      .catch(this.errorService.handle.bind(this.errorService))
      .then(() => this.isGoToNextStepInProgress = false);
  }

  onPreviousStepClick(): void {
    if (this.isGoToPreviousStepInProgress) {
      return;
    }

    this.isGoToPreviousStepInProgress = true;
    this.wizardService.goToPreviousStep()
      .catch(this.errorService.handle.bind(this.errorService))
      .then(() => this.isGoToPreviousStepInProgress = false);
  }
}
