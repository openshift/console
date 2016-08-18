import { Component } from '@angular/core';
import { ROUTER_DIRECTIVES } from '@angular/router-deprecated';
import { WizForm } from './models';
import { WizardService } from './wizard.service';
import { Wizard } from './models';
import { LaunchService } from '../launch/launch.service';
import { LaunchStatus } from '../launch/models';

@Component({
  selector: 'wiz-nav',
  templateUrl: 'app/static/src/wizard/nav.component.html',
  directives: [ROUTER_DIRECTIVES],
})
export class NavComponent {
  constructor(
    public launchService: LaunchService,
    public wizardService: WizardService
  ) { }

  get isNavigationEnabled(): boolean {
    let status: LaunchStatus = this.launchService.launch.status;
    return status === LaunchStatus.Pending || status === LaunchStatus.Failure;
  }

  isFormNavigatable(form: WizForm): boolean {
    return this.isNavigationEnabled && this.wizardService.wizard.isFormNavigatable(form);
  }

  get wizard(): Wizard {
    return this.wizardService.wizard;
  }
}
