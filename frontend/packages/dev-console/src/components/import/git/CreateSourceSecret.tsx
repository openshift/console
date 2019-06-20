import * as React from 'react';
import { FormGroup, ControlLabel } from 'patternfly-react';
import { Dropdown } from '@console/internal/components/utils';
import {
  BasicAuthSubform,
  SSHAuthSubform,
} from '@console/internal/components/secrets/create-secret';

export enum SecretType {
  basicAuth = 'kubernetes.io/basic-auth',
  sshAuth = 'kubernetes.io/ssh-auth',
}

export type CreateSourceSecretState = {
  type: SecretType;
  stringData: {
    [key: string]: string;
  };
  authType: SecretType.basicAuth | SecretType.sshAuth;
};

export type CreateSourceSecretProps = {
  onChange: Function;
  selectedKey: string;
  secretType: SecretType;
  secretName: string;
  secretCredentials: {
    [key: string]: string;
  };
};

export default class CreateSourceSecret extends React.Component<
  CreateSourceSecretProps,
  CreateSourceSecretState
> {
  constructor(props) {
    super(props);
    this.state = {
      type: this.props.secretType,
      stringData: this.props.secretCredentials,
      authType: SecretType.basicAuth,
    };
  }

  onDataChange = (secretsData) => {
    this.setState(
      {
        stringData: { ...secretsData },
      },
      () =>
        this.props.onChange(
          this.props.secretName,
          this.props.selectedKey,
          this.state.type,
          this.state.stringData,
        ),
    );
  };

  changeAuthenticationType = (type: SecretType) => {
    this.setState({
      type,
      stringData: {},
    });
  };

  render() {
    const authTypes = {
      [SecretType.basicAuth]: 'Basic Authentication',
      [SecretType.sshAuth]: 'SSH Key',
    };
    return (
      <React.Fragment>
        <FormGroup controlId="authentication-type">
          <ControlLabel className="co-create-secret__dropdown">Authentication Type</ControlLabel>

          <Dropdown
            items={authTypes}
            dropDownClassName="dropdown--full-width"
            id="dropdown-selectbox"
            selectedKey={this.state.authType}
            onChange={this.changeAuthenticationType}
          />
        </FormGroup>
        {this.state.type === SecretType.basicAuth ? (
          <BasicAuthSubform onChange={this.onDataChange} stringData={this.state.stringData} />
        ) : (
          <SSHAuthSubform onChange={this.onDataChange} stringData={this.state.stringData} />
        )}
      </React.Fragment>
    );
  }
}
