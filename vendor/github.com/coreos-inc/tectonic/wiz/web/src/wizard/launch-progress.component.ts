import { Component, Input } from '@angular/core';
import { LaunchStatus, LaunchStep } from '../launch/models';

@Component({
  selector: 'wiz-launch-progress',
  templateUrl: 'app/static/src/wizard/launch-progress.component.html',
})
export class LaunchProgressComponent {
  @Input() steps: LaunchStep[];

  getStepColorCssClass(step: LaunchStep): string {
    let statusAsString: string;

    switch (step.status) {
      case LaunchStatus.Pending:
        statusAsString = 'pending';
        break;

      case LaunchStatus.Running:
        statusAsString = 'running';
        break;

      case LaunchStatus.Success:
        statusAsString = 'success';
        break;

      case LaunchStatus.Failure:
        statusAsString = 'error';
        break;
    }

    return `wiz-${statusAsString}-fg`;
  }

  getStepIconCssClass(step: LaunchStep): string {
    switch (step.status) {
      case LaunchStatus.Running:
        return 'fa-spinner fa-spin';

      case LaunchStatus.Success:
        return 'fa-check-circle';

      case LaunchStatus.Failure:
        return 'fa-exclamation-triangle';
    }
  }
}
