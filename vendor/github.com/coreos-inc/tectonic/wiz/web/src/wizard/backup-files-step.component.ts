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
  selector: 'wiz-backup-files-step',
  templateUrl: 'app/static/src/wizard/backup-files-step.component.html',
  styleUrls: ['app/static/src/wizard/backup-files-step.component.css']
})
export class BackupFilesStepComponent {
  constructor(
    public errorService: ErrorService,
    public wizardService: WizardService
  ) { }

  onDownloadClick(): void {
    this.wizardService.downloadConfiguration();
  }

  onLaunchClick(): void {
    this.wizardService.goToNextStep()
      .catch(this.errorService.handle.bind(this.errorService));
  }

  onBackClick(): void {
    this.wizardService.goToPreviousStep()
      .catch(this.errorService.handle.bind(this.errorService));
  }
}
