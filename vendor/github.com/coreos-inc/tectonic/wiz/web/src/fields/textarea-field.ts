import {
  BaseField,
  BaseFieldConfig,
} from './base-field';

export interface TextAreaFieldConfig extends BaseFieldConfig {
  uploadLabel?: string
}

export class TextAreaField extends BaseField<string> {
  path = 'app/fields/components/textarea';

  placeholder: string;
  uploadLabel: string;

  constructor(config: TextAreaFieldConfig) {
    super(config);

    this.placeholder = config['placeholder'] || '';
    this.uploadLabel = config.uploadLabel;
  }
}
