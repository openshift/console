import * as React from 'react';
import { withTranslation } from 'react-i18next';
import { WithT } from 'i18next';
import { DroppableFileInput } from './DropableFileInput';
import { KeyValueEntryFormState, KeyValueEntryFormProps } from './types';
import { Base64 } from 'js-base64';

export class KeyValueEntryFormWithTranslation extends React.Component<
  KeyValueEntryFormProps & WithT,
  KeyValueEntryFormState
> {
  constructor(props) {
    super(props);
    this.state = {
      key: props.entry.key,
      value: props.entry.value,
      isBinary_: props.entry.isBinary_,
    };
    this.onValueChange = this.onValueChange.bind(this);
    this.onKeyChange = this.onKeyChange.bind(this);
  }
  onValueChange(fileData, isBinary) {
    this.setState(
      {
        value: isBinary ? fileData : Base64.encode(fileData),
        isBinary_: isBinary,
      },
      () => this.props.onChange(this.state, this.props.id),
    );
  }
  onKeyChange(event) {
    this.setState(
      {
        key: event.target.value,
      },
      () => this.props.onChange(this.state, this.props.id),
    );
  }
  render() {
    const { t } = this.props;
    return (
      <div className="co-create-generic-secret__form">
        <div className="form-group">
          <label className="control-label co-required" htmlFor={`${this.props.id}-key`}>
            {t('public~Key')}
          </label>
          <div>
            <input
              className="pf-v5-c-form-control"
              id={`${this.props.id}-key`}
              type="text"
              name="key"
              onChange={this.onKeyChange}
              value={this.state.key}
              data-test="secret-key"
              required
            />
          </div>
        </div>
        <div className="form-group">
          <div>
            <DroppableFileInput
              onChange={this.onValueChange}
              inputFileData={Base64.decode(this.state.value)}
              id={`${this.props.id}-value`}
              label={t('public~Value')}
              inputFieldHelpText={t(
                'public~Drag and drop file with your value here or browse to upload it.',
              )}
              inputFileIsBinary={this.state.isBinary_}
            />
          </div>
        </div>
      </div>
    );
  }
}

export const KeyValueEntryForm = withTranslation()(KeyValueEntryFormWithTranslation);
