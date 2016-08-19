import { Component } from '@angular/core';
import { RouteConfig, ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router-deprecated';
import { FORM_PROVIDERS, FORM_DIRECTIVES } from '@angular/common';
import { HTTP_PROVIDERS } from '@angular/http';
import { StepComponent } from './wizard/step.component'
import { NavComponent } from './wizard/nav.component';
import { Helper } from './helper/helper';
import { ErrorService } from './error/error.service';
import { WizardService } from './wizard/wizard.service';
import { LaunchService } from './launch/launch.service';
import { BlobService } from './blobs/blob.service';
import { OnBeforeUnloadDirective } from './onbeforeunload/onbeforeunload.component';
import { ToasterService } from './toaster/toaster.service';
import { ToasterComponent } from './toaster/toaster.component';

@Component({
  selector: 'wiz-app',
  templateUrl: 'app/static/src/app.component.html',
  directives: [
    FORM_DIRECTIVES,
    NavComponent,
    OnBeforeUnloadDirective,
    ROUTER_DIRECTIVES,
    ToasterComponent,
  ],
  providers: [
    BlobService,
    ErrorService,
    FORM_PROVIDERS,
    Helper,
    HTTP_PROVIDERS,
    LaunchService,
    ROUTER_PROVIDERS,
    ToasterService,
    WizardService,
  ],
})
@RouteConfig([
  {
    // Please keep /app/ prefix in sync with
    // server/server.go, rFrontend.HandlerFunc("GET", "/app/", s.appHandler)
    path: '/app/step/:stepNumber',
    name: 'Step',
    component: StepComponent,
  },
  {
    path: '/**',
    redirectTo: ['/Step', {stepNumber: 0}],
  }
])
export class AppComponent {
  isLoaded: boolean;

  constructor(
    public errorService: ErrorService,
    public wizardService: WizardService,
    public launchService: LaunchService
  ) { }

  ngOnInit() {
    this.isLoaded = false;

    Promise.resolve()
      .then(() => this.wizardService.initWizard())
      .then(() => this.launchService.initLaunch())
      .then(() => this.isLoaded = true)
      .catch((error) => this.errorService.handle(error, 'There was an error initializing the installer. Try refreshing the page.'));
  }
}
