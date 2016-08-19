import {
  Component,
} from '@angular/core';

import {
  ErrorService,
} from '../error/error.service';

import {
  WizardService,
} from './wizard.service';

@Component({
  selector: 'wiz-welcome-step',
  templateUrl: 'app/static/src/wizard/welcome-step.component.html',
  styleUrls: ['app/static/src/wizard/welcome-step.component.css']
})
export class WelcomeStepComponent {
  constructor(
    public errorService: ErrorService,
    public wizardService: WizardService
  ) { }

  onFileChange(file: File): void {
    this.wizardService.uploadConfiguration(file)
      .then(() => this.wizardService.goToNextStep())
      .catch(this.errorService.handle.bind(this.errorService));
  }

  onGetStartedClick(): void {
    this.wizardService.goToNextStep()
      .catch(this.errorService.handle.bind(this.errorService));
  }
}
