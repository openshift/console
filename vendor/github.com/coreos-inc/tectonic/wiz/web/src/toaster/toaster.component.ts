import {
  Component,
} from '@angular/core';

import {
  Toast,
  ToasterService,
} from './toaster.service';

@Component({
  selector: 'wiz-toaster',
  templateUrl: 'app/static/src/toaster/toaster.component.html',
  styleUrls: ['app/static/src/toaster/toaster.component.css']
})
export class ToasterComponent {
  constructor(
    public toasterService: ToasterService
  ) {}

  get toasts(): Toast[] {
    return this.toasterService.toasts;
  }

  dismiss(toast: Toast) {
    this.toasterService.dismiss(toast);
  }
}
