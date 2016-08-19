import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { WizardService } from '../wizard/wizard.service';
import { Launch, SaveDataLaunchStep, StartTectonicServicesLaunchStep } from './models';

@Injectable()
export class LaunchService {
  launch: Launch;

  constructor(
    public http: Http,
    public wizardService: WizardService
  ) { }

  initLaunch(): Promise<void> {
    return Promise.resolve()
      .then(() => {
        this.launch = new Launch();
        this.launch.addStep(new SaveDataLaunchStep({
          http: this.http,
          wizard: this.wizardService.wizard,
          title: 'Saving Data'
        }));
        this.launch.addStep(new StartTectonicServicesLaunchStep({
          http: this.http,
          wizard: this.wizardService.wizard,
          title: 'Starting Tectonic Services'
        }));
      });
  }
}
