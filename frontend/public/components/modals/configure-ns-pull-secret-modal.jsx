import * as _ from 'lodash-es';
import * as React from 'react';
import * as PropTypes from 'prop-types';
import { Base64 } from 'js-base64';
import { Alert } from '@patternfly/react-core';
import { withTranslation } from 'react-i18next';

import { CONST } from '@console/shared';
import { k8sPatchByName, k8sCreate } from '../../module/k8s';
import { SecretModel, ServiceAccountModel } from '../../models';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { PromiseComponent, ResourceIcon } from '../utils';

const generateSecretData = (formData) => {
  const config = {
    auths: {},
  };

  const authParts = [];

  if (_.trim(formData.username).length >= 1) {
    authParts.push(formData.username);
  }
  authParts.push(formData.password);

  config.auths[formData.address] = {
    auth: Base64.encode(authParts.join(':')),
    email: formData.email,
  };

  return Base64.encode(JSON.stringify(config));
};

class ConfigureNamespacePullSecretWithTranslation extends PromiseComponent {
  constructor(props) {
    super(props);

    this._submit = this._submit.bind(this);
    this._cancel = this.props.cancel.bind(this);

    this._onMethodChange = this._onMethodChange.bind(this);
    this._onFileChange = this._onFileChange.bind(this);

    this.state = Object.assign(this.state, {
      method: 'form',
      fileData: null,
      invalidJson: false,
    });
  }

  _onMethodChange(event) {
    this.setState({ method: event.target.value });
  }

  _onFileChange(event) {
    this.setState({ invalidJson: false, fileData: null });

    const file = event.target.files[0];
    if (!file || file.type !== 'application/json') {
      this.setState({ invalidJson: true });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const input = e.target.result;
      try {
        JSON.parse(input);
      } catch (error) {
        this.setState({ invalidJson: true });
        return;
      }
      this.setState({ fileData: input });
    };
    reader.readAsText(file, 'UTF-8');
  }

  _submit(event) {
    event.preventDefault();
    const { namespace } = this.props;

    let secretData;

    if (this.state.method === 'upload') {
      secretData = Base64.encode(this.state.fileData);
    } else {
      const elements = event.target.elements;
      const formData = {
        username: elements['namespace-pull-secret-username'].value,
        password: elements['namespace-pull-secret-password'].value,
        email: elements['namespace-pull-secret-email'].value || '',
        address: elements['namespace-pull-secret-address'].value,
      };
      secretData = generateSecretData(formData);
    }

    const data = {};
    const pullSecretName = event.target.elements['namespace-pull-secret-name'].value;
    data[CONST.PULL_SECRET_DATA] = secretData;

    const secret = {
      metadata: {
        name: pullSecretName,
        namespace: namespace.metadata.name,
      },
      data,
      type: CONST.PULL_SECRET_TYPE,
    };
    const defaultServiceAccountPatch = [
      {
        op: 'add',
        path: '/imagePullSecrets/-',
        value: { name: pullSecretName },
      },
    ];
    const promise = k8sCreate(SecretModel, secret).then(() =>
      k8sPatchByName(
        ServiceAccountModel,
        'default',
        namespace.metadata.name,
        defaultServiceAccountPatch,
      ),
    );

    this.handlePromise(promise).then(this.props.close);
  }

  render() {
    const { namespace, t } = this.props;

    return (
      <form onSubmit={this._submit} name="form" className="modal-content">
        <ModalTitle>{t('public~Default pull Secret')}</ModalTitle>
        <ModalBody>
          <p>
            {t(
              'public~Specify default credentials to be used to authenticate and download containers within this namespace. These credentials will be the default unless a pod references a specific pull Secret.',
            )}
          </p>

          <div className="row co-m-form-row">
            <div className="col-xs-3">
              <label>{t('public~Namespace')}</label>
            </div>
            <div className="col-xs-9">
              <ResourceIcon kind="Namespace" /> &nbsp;{namespace.metadata.name}
            </div>
          </div>

          <div className="row co-m-form-row">
            <div className="col-xs-3">
              <label htmlFor="namespace-pull-secret-name">{t('public~Secret name')}</label>
            </div>

            <div className="col-xs-9">
              <input
                type="text"
                className="pf-c-form-control"
                id="namespace-pull-secret-name"
                aria-describedby="namespace-pull-secret-name-help"
                required
              />
              <p className="help-block text-muted" id="namespace-pull-secret-name-help">
                {t('public~Friendly name to help you manage this in the future')}
              </p>
            </div>
          </div>

          <div className="row co-m-form-row form-group">
            <div className="col-xs-3">
              <label>{t('public~Method')}</label>
            </div>
            <div className="col-xs-9">
              <div className="radio">
                <label className="control-label">
                  <input
                    type="radio"
                    id="namespace-pull-secret-method--form"
                    checked={this.state.method === 'form'}
                    onChange={this._onMethodChange}
                    value="form"
                  />
                  {t('public~Enter username/password')}
                </label>
              </div>
              <div className="radio">
                <label className="control-label">
                  <input
                    type="radio"
                    checked={this.state.method === 'upload'}
                    onChange={this._onMethodChange}
                    id="namespace-pull-secret-method--upload"
                    value="upload"
                  />
                  {t('public~Upload Docker config.json')}
                </label>
              </div>
            </div>
          </div>

          {this.state.method === 'form' && (
            <div>
              <div className="row co-m-form-row">
                <div className="col-xs-3">
                  <label htmlFor="namespace-pull-secret-address">
                    {t('public~Registry address')}
                  </label>
                </div>
                <div className="col-xs-9">
                  <input
                    type="text"
                    className="pf-c-form-control"
                    id="namespace-pull-secret-address"
                    placeholder={t('public~quay.io')}
                    required
                  />
                </div>
              </div>
              <div className="row co-m-form-row">
                <div className="col-xs-3">
                  <label htmlFor="namespace-pull-secret-email">{t('public~Email address')}</label>
                </div>
                <div className="col-xs-9">
                  <input
                    type="email"
                    className="pf-c-form-control"
                    id="namespace-pull-secret-email"
                    aria-describedby="namespace-pull-secret-email-help"
                  />
                  <p className="help-block text-muted" id="namespace-pull-secret-email-help">
                    {t('public~Optional, depending on registry provider')}
                  </p>
                </div>
              </div>
              <div className="row co-m-form-row">
                <div className="col-xs-3">
                  <label htmlFor="namespace-pull-secret-username">{t('public~Username')}</label>
                </div>
                <div className="col-xs-9">
                  <input
                    type="text"
                    className="pf-c-form-control"
                    id="namespace-pull-secret-username"
                    required
                  />
                </div>
              </div>
              <div className="row co-m-form-row">
                <div className="col-xs-3">
                  <label htmlFor="namespace-pull-secret-password">{t('public~Password')}</label>
                </div>
                <div className="col-xs-9">
                  <input
                    type="password"
                    className="pf-c-form-control"
                    id="namespace-pull-secret-password"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {this.state.method === 'upload' && (
            <div>
              <div className="row co-m-form-row">
                <div className="col-xs-3">
                  <label htmlFor="namespace-pull-secret-file">{t('public~File upload')}</label>
                </div>
                <div className="col-xs-9">
                  <input
                    type="file"
                    id="namespace-pull-secret-file"
                    onChange={this._onFileChange}
                    aria-describedby="namespace-pull-secret-file-help"
                  />
                  <p className="help-block etext-muted" id="namespace-pull-secret-file-help">
                    {t(
                      'public~Properly configured Docker config file in JSON format. Will be base64 encoded after upload.',
                    )}
                  </p>
                </div>
              </div>
              {this.state.invalidJson && (
                <div className="row co-m-form-row">
                  <div className="col-xs-9 col-sm-offset-3">
                    <Alert
                      isInline
                      className="co-alert"
                      variant="danger"
                      title={t('public~Invalid JSON')}
                    >
                      {t('public~The uploaded file is not properly-formatted JSON.')}
                    </Alert>
                  </div>
                </div>
              )}
              {this.state.fileData && (
                <div className="row co-m-form-row">
                  <div className="col-xs-9 col-sm-offset-3">
                    <pre className="co-pre-wrap">{this.state.fileData}</pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={this.state.errorMessage}
          inProgress={this.state.inProgress}
          submitText={t('public~Save')}
          cancel={this._cancel}
          submitDisabled={
            this.state.method === 'upload' && (!this.state.fileData || this.state.invalidJson)
          }
        />
      </form>
    );
  }
}

const ConfigureNamespacePullSecret = withTranslation()(ConfigureNamespacePullSecretWithTranslation);
export const configureNamespacePullSecretModal = createModalLauncher(ConfigureNamespacePullSecret);
ConfigureNamespacePullSecret.propTypes = {
  namespace: PropTypes.object.isRequired,
  pullSecret: PropTypes.object,
};
