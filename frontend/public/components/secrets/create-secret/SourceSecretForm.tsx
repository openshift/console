import * as React from 'react';
import { withTranslation } from 'react-i18next';
import { WithT } from 'i18next';
import { Dropdown } from '../../utils';
import { BasicAuthSubform } from './BasicAuthSubform';
import { SSHAuthSubform } from './SSHAuthSubform';
import { SecretStringData, SecretType, SecretSubFormProps } from './types';

class SourceSecretFormWithTranslation extends React.Component<
  SecretSubFormProps & WithT,
  SourceSecretFormState
> {
  constructor(props) {
    super(props);
    this.state = {
      type: this.props.secretType,
      stringData: this.props.stringData || {},
      authType: SecretType.basicAuth,
    };
    this.changeAuthenticationType = this.changeAuthenticationType.bind(this);
    this.onDataChanged = this.onDataChanged.bind(this);
  }
  changeAuthenticationType(type: SecretType) {
    this.setState(
      {
        type,
      },
      () => this.props.onChange(this.state),
    );
  }
  onDataChanged(secretsData) {
    this.setState(
      {
        stringData: { ...secretsData },
      },
      () => this.props.onChange(this.state),
    );
  }
  render() {
    const { t } = this.props;
    const authTypes = {
      [SecretType.basicAuth]: t('public~Basic authentication'),
      [SecretType.sshAuth]: t('public~SSH key'),
    };
    return (
      <>
        {this.props.isCreate ? (
          <div className="form-group">
            <label className="control-label" htmlFor="secret-type">
              {t('public~Authentication type')}
            </label>
            <div className="co-create-secret__dropdown">
              <Dropdown
                items={authTypes}
                dropDownClassName="dropdown--full-width"
                id="dropdown-selectbox"
                selectedKey={this.state.authType}
                onChange={this.changeAuthenticationType}
              />
            </div>
          </div>
        ) : null}
        {this.state.type === SecretType.basicAuth ? (
          <BasicAuthSubform onChange={this.onDataChanged} stringData={this.state.stringData} />
        ) : (
          <SSHAuthSubform onChange={this.onDataChanged} stringData={this.state.stringData} />
        )}
      </>
    );
  }
}

export const SourceSecretForm = withTranslation()(SourceSecretFormWithTranslation);

type SourceSecretFormState = {
  type: SecretType;
  stringData: SecretStringData;
  authType: SecretType.basicAuth | SecretType.sshAuth;
};
