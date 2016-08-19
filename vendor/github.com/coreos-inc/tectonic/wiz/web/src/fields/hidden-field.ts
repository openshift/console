import { BaseField } from './base-field';

export class HiddenField extends BaseField<string> {
  path: string = 'app/fields/components/hidden';
  hidden: boolean = true;
}
