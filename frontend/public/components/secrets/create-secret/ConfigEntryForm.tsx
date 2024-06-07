import * as _ from 'lodash-es';
import * as React from 'react';
import { withTranslation } from 'react-i18next';
import { WithT } from 'i18next';
import { Base64 } from 'js-base64';

class ConfigEntryFormWithTranslation extends React.Component<
  ConfigEntryFormProps & WithT,
  ConfigEntryFormState
> {
  constructor(props) {
    super(props);
    this.state = {
      address: _.get(this.props.entry, 'address'),
      username: _.get(this.props.entry, 'username'),
      password: _.get(this.props.entry, 'password'),
      email: _.get(this.props.entry, 'email'),
      auth: _.get(this.props.entry, 'auth'),
      uid: _.get(this.props, 'uid'),
    };
  }

  propagateChange = () => {
    const { onChange, id } = this.props;
    onChange(this.state, id);
  };

  onAddressChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({ address: event.currentTarget.value }, this.propagateChange);
  };

  onUsernameChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    const username = event.currentTarget.value;
    this.setState(
      (state: ConfigEntryFormState) => ({
        username,
        auth: Base64.encode(`${username}:${state.password}`),
      }),
      this.propagateChange,
    );
  };

  onPasswordChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    const password = event.currentTarget.value;
    this.setState(
      (state: ConfigEntryFormState) => ({
        password,
        auth: Base64.encode(`${state.username}:${password}`),
      }),
      this.propagateChange,
    );
  };

  onEmailChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({ email: event.currentTarget.value }, this.propagateChange);
  };

  onBlurHandler: React.ReactEventHandler<HTMLInputElement> = (event) => {
    const { name, value } = event.currentTarget;
    this.setState(
      (prevState) => ({
        ...prevState,
        [name]: value.trim(),
      }),
      this.propagateChange,
    );
  };

  render() {
    const { t } = this.props;

    return (
      <div className="co-m-pane__body-group" data-test-id="create-image-secret-form">
        <div className="form-group">
          <label className="control-label co-required" htmlFor={`${this.props.id}-address`}>
            {t('public~Registry server address')}
          </label>
          <div>
            <input
              className="pf-v5-c-form-control"
              id={`${this.props.id}-address`}
              aria-describedby={`${this.props.id}-address-help`}
              type="text"
              name="address"
              onChange={this.onAddressChanged}
              value={this.state.address}
              onBlur={this.onBlurHandler}
              data-test="image-secret-address"
              required
            />
          </div>
          <p className="help-block" id={`${this.props.id}-address-help`}>
            {t('public~For example quay.io or docker.io')}
          </p>
        </div>
        <div className="form-group">
          <label className="control-label co-required" htmlFor={`${this.props.id}-username`}>
            {t('public~Username')}
          </label>
          <div>
            <input
              className="pf-v5-c-form-control"
              id={`${this.props.id}-username`}
              type="text"
              name="username"
              onChange={this.onUsernameChanged}
              value={this.state.username}
              onBlur={this.onBlurHandler}
              data-test="image-secret-username"
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label className="control-label co-required" htmlFor={`${this.props.id}-password`}>
            {t('public~Password')}
          </label>
          <div>
            <input
              className="pf-v5-c-form-control"
              id={`${this.props.id}-password`}
              type="password"
              name="password"
              onChange={this.onPasswordChanged}
              value={this.state.password}
              onBlur={this.onBlurHandler}
              data-test="image-secret-password"
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label className="control-label" htmlFor={`${this.props.id}-email`}>
            {t('public~Email')}
          </label>
          <div>
            <input
              className="pf-v5-c-form-control"
              id={`${this.props.id}-email`}
              type="text"
              name="email"
              onChange={this.onEmailChanged}
              value={this.state.email}
              onBlur={this.onBlurHandler}
              data-test="image-secret-email"
            />
          </div>
        </div>
      </div>
    );
  }
}

export const ConfigEntryForm = withTranslation()(ConfigEntryFormWithTranslation);

type ConfigEntryFormState = {
  address: string;
  username: string;
  password: string;
  email: string;
  auth: string;
  uid: string;
};

type ConfigEntryFormProps = {
  id: number;
  entry: Object;
  onChange: Function;
};
