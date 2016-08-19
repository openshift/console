import { Component, Input, Pipe, PipeTransform } from '@angular/core';
import { AbstractControl } from '@angular/common';

@Pipe({
  name: 'prettyValidationError',
  pure: false,
})
export class PrettyValidationErrorPipe implements PipeTransform {
  transform(value: {}) : string {
    if (!value) {
      return '';
    }
    if (value['required']) {
      return 'This field is required.';
    }

    let keys = Object.keys(value);
    if (!keys.length) {
      return '';
    }

    return value[keys[0]];
  }
}

@Component({
  selector: 'wiz-validation-error',
  templateUrl: 'app/static/src/validators/validation-error.html',
  pipes: [PrettyValidationErrorPipe],
})
export class WizValidationErrorComponent {
  @Input() control: AbstractControl;
}
