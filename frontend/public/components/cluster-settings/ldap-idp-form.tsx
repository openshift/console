import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { withTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { ActionGroup, Button } from '@patternfly/react-core';

import { ConfigMapModel, SecretModel } from '../../models';
import { IdentityProvider, k8sCreate, K8sResourceKind, OAuthKind } from '../../module/k8s';
import { ButtonBar, ListInput, PromiseComponent, history } from '../utils';
import { addIDP, getOAuthResource, redirectToOAuthPage, mockNames } from './';
import { IDPNameInput } from './idp-name-input';
import { IDPCAFileInput } from './idp-cafile-input';

class AddLDAPPageWithTranslation extends PromiseComponent<AddLDAPPageProps, AddLDAPPageState> {
  readonly state: AddLDAPPageState = {
    name: 'ldap',
    url: '',
    bindDN: '',
    bindPassword: '',
    attributesID: ['dn'],
    attributesPreferredUsername: ['uid'],
    attributesName: ['cn'],
    attributesEmail: [],
    caFileContent: '',
    inProgress: false,
    errorMessage: '',
  };

  getOAuthResource(): Promise<OAuthKind> {
    return this.handlePromise(getOAuthResource());
  }

  createCAConfigMap(): Promise<K8sResourceKind> {
    const { caFileContent } = this.state;
    if (!caFileContent) {
      return Promise.resolve(null);
    }

    const ca = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        generateName: 'ldap-ca-',
        namespace: 'openshift-config',
      },
      data: {
        'ca.crt': caFileContent,
      },
    };

    return this.handlePromise(k8sCreate(ConfigMapModel, ca));
  }

  createBindPasswordSecret(): Promise<K8sResourceKind> {
    const { bindPassword } = this.state;
    if (!bindPassword) {
      return Promise.resolve(null);
    }

    const secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        generateName: 'ldap-bind-password-',
        namespace: 'openshift-config',
      },
      stringData: {
        bindPassword,
      },
    };

    return this.handlePromise(k8sCreate(SecretModel, secret));
  }

  addLDAPIDP(
    oauth: OAuthKind,
    bindPasswordSecretName: string,
    caConfigMapName: string,
    dryRun?: boolean,
  ): Promise<K8sResourceKind> {
    const {
      name,
      url,
      bindDN,
      attributesID,
      attributesPreferredUsername,
      attributesName,
      attributesEmail,
    } = this.state;
    const idp: IdentityProvider = {
      name,
      mappingMethod: 'claim',
      type: 'LDAP',
      ldap: {
        url,
        insecure: false,
        attributes: {
          id: attributesID,
          preferredUsername: attributesPreferredUsername,
          name: attributesName,
          email: attributesEmail,
        },
      },
    };

    if (bindDN) {
      idp.ldap.bindDN = bindDN;
    }

    if (bindPasswordSecretName) {
      idp.ldap.bindPassword = {
        name: bindPasswordSecretName,
      };
    }

    if (caConfigMapName) {
      idp.ldap.ca = {
        name: caConfigMapName,
      };
    }

    return this.handlePromise(addIDP(oauth, idp, dryRun));
  }

  submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    // Clear any previous errors.
    this.setState({ errorMessage: '' });
    this.getOAuthResource().then((oauth: OAuthKind) => {
      const mockSecret = this.state.bindPassword ? mockNames.secret : '';
      const mockCA = this.state.caFileContent ? mockNames.ca : '';
      this.addLDAPIDP(oauth, mockSecret, mockCA, true)
        .then(() => {
          const promises = [this.createBindPasswordSecret(), this.createCAConfigMap()];

          Promise.all(promises)
            .then(([bindPasswordSecret, caConfigMap]) => {
              const bindPasswordSecretName = _.get(bindPasswordSecret, 'metadata.name');
              const caConfigMapName = _.get(caConfigMap, 'metadata.name');
              return this.addLDAPIDP(oauth, bindPasswordSecretName, caConfigMapName);
            })
            .then(redirectToOAuthPage);
        })
        .catch((err) => {
          this.setState({ errorMessage: err });
        });
    });
  };

  nameChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({ name: event.currentTarget.value });
  };

  urlChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({ url: event.currentTarget.value });
  };

  bindDNChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({ bindDN: event.currentTarget.value });
  };

  bindPasswordChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({ bindPassword: event.currentTarget.value });
  };

  attributesIDChanged = (attributesID: string[]) => {
    this.setState({ attributesID });
  };

  attributesPreferredUsernameChanged = (attributesPreferredUsername: string[]) => {
    this.setState({ attributesPreferredUsername });
  };

  attributesNameChanged = (attributesName: string[]) => {
    this.setState({ attributesName });
  };

  attributesEmailChanged = (attributesEmail: string[]) => {
    this.setState({ attributesEmail });
  };

  caFileChanged = (caFileContent: string) => {
    this.setState({ caFileContent });
  };

  render() {
    const {
      name,
      url,
      bindDN,
      bindPassword,
      attributesID,
      attributesPreferredUsername,
      attributesName,
      caFileContent,
    } = this.state;
    const { t } = this.props;
    const title = t('ldap-idp-form~Add Identity Provider: LDAP');
    return (
      <div className="co-m-pane__body">
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <form onSubmit={this.submit} name="form" className="co-m-pane__body-group co-m-pane__form">
          <h1 className="co-m-pane__heading">{title}</h1>
          <p className="co-m-pane__explanation">
            {t('ldap-idp-form~Integrate with an LDAP identity provider.')}
          </p>
          <IDPNameInput value={name} onChange={this.nameChanged} />
          <div className="form-group">
            <label className="control-label co-required" htmlFor="url">
              {t('ldap-idp-form~URL')}
            </label>
            <input
              className="pf-c-form-control"
              type="url"
              onChange={this.urlChanged}
              value={url}
              id="url"
              required
              aria-describedby="url-help"
            />
            <div className="help-block" id="url-help">
              {t(
                'ldap-idp-form~An RFC 2255 URL which specifies the LDAP search parameters to use.',
              )}
            </div>
          </div>
          <div className="form-group">
            <label className="control-label" htmlFor="bind-dn">
              {t('ldap-idp-form~Bind DN')}
            </label>
            <input
              className="pf-c-form-control"
              type="text"
              onChange={this.bindDNChanged}
              value={bindDN}
              id="bind-dn"
              aria-describedby="bind-dn-help"
            />
            <div className="help-block" id="bind-dn-help">
              {t('ldap-idp-form~DN to bind with during the search phase.')}
            </div>
          </div>
          <div className="form-group">
            <label className="control-label" htmlFor="bind-password">
              {t('ldap-idp-form~Bind password')}
            </label>
            <input
              className="pf-c-form-control"
              type="password"
              onChange={this.bindPasswordChanged}
              value={bindPassword}
              id="bind-password"
              aria-describedby="bind-password-help"
            />
            <div className="help-block" id="bind-password-help">
              {t('ldap-idp-form~Password to bind with during the search phase.')}
            </div>
          </div>
          <div className="co-form-section__separator" />
          <h3>{t('ldap-idp-form~Attributes')}</h3>
          <p className="co-help-text">
            {t('ldap-idp-form~Attributes map LDAP attributes to identities.')}
          </p>
          <ListInput
            label={t('ldap-idp-form~ID')}
            required
            initialValues={attributesID}
            onChange={this.attributesIDChanged}
            helpText={t(
              'ldap-idp-form~The list of attributes whose values should be used as the user ID.',
            )}
          />
          <ListInput
            label={t('ldap-idp-form~Preferred username')}
            initialValues={attributesPreferredUsername}
            onChange={this.attributesPreferredUsernameChanged}
            helpText={t(
              'ldap-idp-form~The list of attributes whose values should be used as the preferred username.',
            )}
          />
          <ListInput
            label={t('ldap-idp-form~Name')}
            initialValues={attributesName}
            onChange={this.attributesNameChanged}
            helpText={t(
              'ldap-idp-form~The list of attributes whose values should be used as the display name.',
            )}
          />
          <ListInput
            label={t('ldap-idp-form~Email')}
            onChange={this.attributesEmailChanged}
            helpText={t(
              'ldap-idp-form~The list of attributes whose values should be used as the email address.',
            )}
          />
          <div className="co-form-section__separator" />
          <h3>{t('ldap-idp-form~More options')}</h3>
          <IDPCAFileInput value={caFileContent} onChange={this.caFileChanged} />
          <ButtonBar errorMessage={this.state.errorMessage} inProgress={this.state.inProgress}>
            <ActionGroup className="pf-c-form">
              <Button type="submit" variant="primary" data-test-id="add-idp">
                {t('public~Add')}
              </Button>
              <Button type="button" variant="secondary" onClick={history.goBack}>
                {t('public~Cancel')}
              </Button>
            </ActionGroup>
          </ButtonBar>
        </form>
      </div>
    );
  }
}

export const AddLDAPPage = withTranslation()(AddLDAPPageWithTranslation);

export type AddLDAPPageState = {
  name: string;
  url: string;
  bindDN: string;
  bindPassword: string;
  attributesID: string[];
  attributesPreferredUsername: string[];
  attributesName: string[];
  attributesEmail: string[];
  caFileContent: string;
  inProgress: boolean;
  errorMessage: string;
};

type AddLDAPPageProps = {
  t: TFunction;
};
