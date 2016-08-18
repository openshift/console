import {
  Component
} from '@angular/core';

import {
  ComponentInstruction,
  OnActivate,
  RouteParams,
  Router
} from '@angular/router-deprecated';

import {
  WizardService
} from './wizard.service';

import {
  LaunchService
} from '../launch/launch.service';

import {
  LaunchStatus
} from '../launch/models';

import {
  StepOutletDirective
} from './step-outlet.directive';

@Component({
  selector: 'wiz-step',
  template: '<wiz-step-outlet></wiz-step-outlet>',
  directives: [StepOutletDirective],
})
export class StepComponent implements OnActivate {
  constructor(
    public launchService: LaunchService,
    public routeParams: RouteParams,
    public router: Router,
    public wizardService: WizardService
  ) { }

  routerOnActivate(nextInstruction: ComponentInstruction, prevInstruction: ComponentInstruction): boolean {
    let step: number = +this.routeParams.get('stepNumber');
    const canProceed: boolean = ((): boolean => {
      // launch is in progress or succeeded, no other forms are allowed
      // to be accessed at this moment except for launch form itself
      let status: LaunchStatus = this.launchService.launch.status;
      if (status === LaunchStatus.Running || status === LaunchStatus.Success) {
        if (step !== this.wizardService.wizard.indexOfLaunchWizForm) {
          step = this.wizardService.wizard.indexOfLaunchWizForm
          return false;
        }

        return true;
      }

      // it's not allowed to go any further than one step ahead of
      // last submitted form
      const indexOfLastSubmittedWizForm: number = this.wizardService.wizard.indexOfLastSubmittedWizForm;
      if ((step - indexOfLastSubmittedWizForm) > 1) {
        step = indexOfLastSubmittedWizForm === -1 ? 0 : indexOfLastSubmittedWizForm;
        return false;
      }

      return true;
    })();

    if (canProceed) {
      this.wizardService.wizard.activeFormIndex = step;
    } else {
      this.router.navigate(['/Step', { stepNumber: step }]);
    }

    return canProceed;
  }
}
