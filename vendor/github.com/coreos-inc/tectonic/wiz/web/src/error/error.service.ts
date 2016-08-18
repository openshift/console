import {
  Injectable,
} from '@angular/core';

import {
  ToasterService,
} from '../toaster/toaster.service'

@Injectable()
export class ErrorService {
  constructor(
    public toasterService: ToasterService
  ) { }

  handle(error: Error, message: string = 'Oops! Something went wrong. Please contact support, or try again.'): void {
    console.error(message, error.stack || error);
    this.toasterService.error(message);
  }
}
