import * as React from 'react';
import { withTranslation } from 'react-i18next';
import { WithT } from 'i18next';
import { generateSecret } from '.';
import { SecretStringData } from './types';

class WebHookSecretFormWithTranslation extends React.Component<
  WebHookSecretFormProps & WithT,
  WebHookSecretFormState
> {
  constructor(props) {
    super(props);
    this.state = {
      stringData: { WebHookSecretKey: this.props.stringData.WebHookSecretKey || '' },
    };
    this.changeWebHookSecretkey = this.changeWebHookSecretkey.bind(this);
    this.generateWebHookSecret = this.generateWebHookSecret.bind(this);
  }
  changeWebHookSecretkey(event) {
    this.setState(
      {
        stringData: { WebHookSecretKey: event.target.value },
      },
      () => this.props.onChange(this.state),
    );
  }
  generateWebHookSecret() {
    this.setState(
      {
        stringData: { WebHookSecretKey: generateSecret() },
      },
      () => this.props.onChange(this.state),
    );
  }
  render() {
    const { t } = this.props;
    return (
      <div className="form-group">
        <label className="control-label co-required" htmlFor="webhook-secret-key">
          {t('public~Webhook secret key')}
        </label>
        <div className="pf-v5-c-input-group">
          <input
            className="pf-v5-c-form-control"
            id="webhook-secret-key"
            data-test="secret-key"
            type="text"
            name="webhookSecretKey"
            onChange={this.changeWebHookSecretkey}
            value={this.state.stringData.WebHookSecretKey}
            aria-describedby="webhook-secret-help"
            required
          />
          <button
            type="button"
            onClick={this.generateWebHookSecret}
            className="pf-v5-c-button pf-m-tertiary"
            data-test="webhook-generate-button"
          >
            {t('public~Generate')}
          </button>
        </div>
        <p className="help-block" id="webhook-secret-help">
          {t('public~Value of the secret will be supplied when invoking the webhook.')}
        </p>
      </div>
    );
  }
}

export const WebHookSecretForm = withTranslation()(WebHookSecretFormWithTranslation);

type WebHookSecretFormState = {
  stringData: SecretStringData;
};

type WebHookSecretFormProps = {
  onChange: Function;
  onError: Function;
  onFormDisable: Function;
  secretType: string;
  stringData: SecretStringData;
};
