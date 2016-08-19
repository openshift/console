import { Http } from '@angular/http';
import { Wizard } from '../wizard/models';

export enum LaunchStatus {
  Pending,
  Running,
  Success,
  Failure
};

export class Launch {
  steps: LaunchStep[] = [];
  progress: LaunchStep[] = []; // finished or in-flight steps
  status: LaunchStatus = LaunchStatus.Pending;
  error: Error;

  addStep(step: LaunchStep) {
    this.steps.push(step);
  }

  start(): Promise<void> {
    this.status = LaunchStatus.Running;
    this.progress = [];
    this.error = undefined;

    return this._start(0)
      .then(() => {
        this.status = LaunchStatus.Success;
      })
      .catch(error => {
        this.status = LaunchStatus.Failure;
        this.error = error;
        throw error;
      })
    ;
  }

  _start(index: number): Promise<void> {
    if (index < this.steps.length) { // any more steps to go?
      this.progress.push(this.steps[index]); // add new step to progress list
      return this.steps[index].start().then(() => this._start(index + 1)); // move to next step
    }

    return Promise.resolve();
  }
}

export class LaunchStep {
  http: Http;
  wizard: Wizard;
  title: string;
  status: LaunchStatus = LaunchStatus.Pending;
  error: Error;

  constructor(config: {
    http: Http,
    wizard: Wizard,
    title: string
  }) {
    this.http = config.http;
    this.wizard = config.wizard;
    this.title = config.title;
  }

  start(): Promise<void> {
    this.status = LaunchStatus.Running;
    this.error = undefined;

    return this._start()
      .then(() => {
        this.status = LaunchStatus.Success;
      })
      .catch((error) => {
        this.status = LaunchStatus.Failure;
        this.error = error;
        throw error;
      })
    ;
  }

  _start(): Promise<void> {
    return Promise.resolve();
  }
}

export class SaveDataLaunchStep extends LaunchStep {
  _start(): Promise<void> {
    let url = this.wizard.metadata.submitEndpoint;
    return this.http.post(url, JSON.stringify(this.wizard.payload)).toPromise().then(() => { });
  }
}

export class StartTectonicServicesLaunchStep extends LaunchStep {
  _start(): Promise<void> {
    let self = this;
    let startTime = Date.now();
    return new Promise<void>((resolve, reject) => {
      (function tick() {
        if ((Date.now() - startTime) > 10 * 60 * 1000) { // 10 minutes
          return reject(new Error('Timeout'));
        }

        self._getStatus()
          .then(status => {
            if (status === 'Success') {
              return resolve();
            }

            setTimeout(tick, 1000);
          })
          .catch(error => {
            console.error(error.stack);
            setTimeout(tick, 1000);
          });
      })();
    });
  }

  _getStatus(): Promise<string> {
    return this.http.get('tectonic/proxy?target=' + encodeURIComponent(this.wizard.metadata.statusEndpoint)).toPromise()
      .then(res => res.json().status)
    ;
  }
}
