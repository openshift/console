import * as React from 'react';
import { withTranslation } from 'react-i18next';
import { WithT } from 'i18next';
import { SecretStringData } from './types';

class BasicAuthSubformWithTranslation extends React.Component<
  BasicAuthSubformProps & WithT,
  BasicAuthSubformState
> {
  constructor(props) {
    super(props);
    this.state = {
      username: this.props.stringData.username || '',
      password: this.props.stringData.password || '',
    };
    this.changeData = this.changeData.bind(this);
  }
  changeData(event) {
    this.setState(
      {
        [event.target.name]: event.target.value,
      } as BasicAuthSubformState,
      () => this.props.onChange(this.state),
    );
  }

  render() {
    const { t } = this.props;
    return (
      <>
        <div className="form-group">
          <label className="control-label" htmlFor="username">
            {t('public~Username')}
          </label>
          <div>
            <input
              className="pf-v5-c-form-control"
              id="username"
              data-test="secret-username"
              aria-describedby="username-help"
              type="text"
              name="username"
              onChange={this.changeData}
              value={this.state.username}
            />
            <p className="help-block" id="username-help">
              {t('public~Optional username for Git authentication.')}
            </p>
          </div>
        </div>
        <div className="form-group">
          <label className="control-label co-required" htmlFor="password">
            {t('public~Password or token')}
          </label>
          <div>
            <input
              className="pf-v5-c-form-control"
              id="password"
              data-test="secret-password"
              aria-describedby="password-help"
              type="password"
              name="password"
              onChange={this.changeData}
              value={this.state.password}
              required
            />
            <p className="help-block" id="password-help">
              {t(
                'public~Password or token for Git authentication. Required if a ca.crt or .gitconfig file is not specified.',
              )}
            </p>
          </div>
        </div>
      </>
    );
  }
}

export const BasicAuthSubform = withTranslation()(BasicAuthSubformWithTranslation);

type BasicAuthSubformState = {
  username: string;
  password: string;
};

type BasicAuthSubformProps = {
  onChange: Function;
  stringData: SecretStringData;
};
