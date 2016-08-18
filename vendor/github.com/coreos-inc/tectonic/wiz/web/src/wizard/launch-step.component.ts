import {
  Component,
  OnInit,
} from '@angular/core';

import {
  CongratulationsComponent,
} from './congratulations.component';

import {
  LaunchProgressComponent,
} from './launch-progress.component';

import {
  ErrorService,
} from '../error/error.service';

import {
  WizardService,
} from './wizard.service';

import {
  LaunchService,
} from '../launch/launch.service';

import {
  Launch, LaunchStatus,
} from '../launch/models';

@Component({
  selector: 'wiz-launch-step',
  templateUrl: 'app/static/src/wizard/launch-step.component.html',
  styleUrls: ['app/static/src/wizard/launch-step.component.css'],
  directives: [
    CongratulationsComponent,
    LaunchProgressComponent,
  ]
})
export class LaunchStepComponent implements OnInit {
  constructor(
    public errorService: ErrorService,
    public wizardService: WizardService,
    public launchService: LaunchService
  ) { }

  get launch(): Launch {
    return this.launchService.launch;
  }

  get isSuccess(): boolean {
    return this.launchService.launch.status === LaunchStatus.Success;
  }

  get isFailure(): boolean {
    return this.launchService.launch.status === LaunchStatus.Failure;
  }

  get url(): string {
    let urlFrom = this.wizardService.wizard.manifest.launchForm.urlFrom;
    return this.wizardService.wizard.wizardControl.find(urlFrom).value;
  }

  ngOnInit() {
    if (this.launchService.launch.status !== LaunchStatus.Pending) {
      return;
    }

    this.launch.start()
      .catch(this.errorService.handle.bind(this.errorService));
  }

  onBackClick() {
    this.wizardService.goToPreviousStep()
      .catch(this.errorService.handle.bind(this.errorService));
  }
}
