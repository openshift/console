import {
  Directive,
  DynamicComponentLoader,
  OnInit,
  Type,
  ViewContainerRef
} from '@angular/core';

import {
  ErrorService,
} from '../error/error.service';

import {
  WizardService,
} from './wizard.service';

import {
  WelcomeStepComponent,
} from './welcome-step.component';

import {
  FormStepComponent,
} from './form-step.component';

import {
  BackupFilesStepComponent,
} from './backup-files-step.component';

import {
  LaunchStepComponent,
} from './launch-step.component';

@Directive({ selector: 'wiz-step-outlet' })
export class StepOutletDirective implements OnInit {
  constructor(
    public loader: DynamicComponentLoader,
    public viewContainerRef: ViewContainerRef,
    public errorService: ErrorService,
    public wizardService: WizardService
  ) { }

  ngOnInit(): void {
    let componentType: Type = getComponentType(this.wizardService.wizard.activeForm.type);
    this.loader.loadNextToLocation(componentType, this.viewContainerRef)
      .catch(this.errorService.handle.bind(this.errorService));
  }
}

function getComponentType(type: string): Type {
  switch (type) {
    case 'WelcomeWizForm':
      return WelcomeStepComponent;

    case 'BackupFilesWizForm':
      return BackupFilesStepComponent;

    case 'LaunchWizForm':
      return LaunchStepComponent;

    default:
      return FormStepComponent;
  }
}
