import * as _ from 'lodash-es';
import * as React from 'react';
import { withTranslation } from 'react-i18next';
import { WithT } from 'i18next';
import { Dropdown } from '../../utils';
import {
  SecretType,
  getImageSecretKey,
  AUTHS_KEY,
  CreateConfigSubform,
  UploadConfigSubform,
} from '.';

class ImageSecretFormWithTranslation extends React.Component<
  ImageSecretFormProps & WithT,
  ImageSecretFormState
> {
  constructor(props) {
    super(props);
    const data = this.props.isCreate ? { '.dockerconfigjson': '{}' } : this.props.stringData;
    let parsedData;
    try {
      parsedData = _.mapValues(data, JSON.parse);
    } catch (err) {
      this.props.onError(`Error parsing secret's data: ${err.message}`);
      parsedData = { '.dockerconfigjson': {} };
    }
    this.state = {
      type: this.props.secretType,
      dataKey: getImageSecretKey(this.props.secretType),
      stringData: parsedData,
      authType: 'credentials',
      disable: false,
    };
    this.onDataChanged = this.onDataChanged.bind(this);
    this.changeFormType = this.changeFormType.bind(this);
    this.onFormDisable = this.onFormDisable.bind(this);
  }
  onDataChanged(secretData) {
    if (!_.isError(secretData)) {
      this.onFormDisable(this.state.disable);
    }
    const dataKey = secretData[AUTHS_KEY] ? '.dockerconfigjson' : '.dockercfg';
    this.setState(
      {
        stringData: { [dataKey]: secretData },
      },
      () =>
        this.props.onChange({
          stringData: _.mapValues(this.state.stringData, JSON.stringify),
        }),
    );
  }
  changeFormType(authType) {
    this.setState({
      authType,
    });
  }
  onFormDisable(disable) {
    this.props.onFormDisable(disable);
  }
  render() {
    const { t } = this.props;
    const authTypes = {
      credentials: t('public~Image registry credentials'),
      'config-file': t('public~Upload configuration file'),
    };
    const data = _.get(this.state.stringData, this.state.dataKey);
    return (
      <>
        {this.props.isCreate && (
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
                onChange={this.changeFormType}
              />
            </div>
          </div>
        )}
        {this.state.authType === 'credentials' ? (
          <CreateConfigSubform onChange={this.onDataChanged} stringData={data} />
        ) : (
          <UploadConfigSubform
            onChange={this.onDataChanged}
            stringData={data}
            onDisable={this.onFormDisable}
          />
        )}
      </>
    );
  }
}

export const ImageSecretForm = withTranslation()(ImageSecretFormWithTranslation);

type ImageSecretFormState = {
  type: SecretType;
  stringData: {
    [key: string]: any;
  };
  authType: string;
  dataKey: string;
  disable: boolean;
};

type ImageSecretFormProps = {
  onChange: Function;
  onError: Function;
  onFormDisable: Function;
  stringData: {
    [key: string]: string;
  };
  secretType: SecretType;
  isCreate: boolean;
};
