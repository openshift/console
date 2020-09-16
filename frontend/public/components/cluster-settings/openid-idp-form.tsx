import * as React from 'react';
import { Helmet } from 'react-helmet';
import { withTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { ActionGroup, Button } from '@patternfly/react-core';

import { SecretModel, ConfigMapModel } from '../../models';
import { IdentityProvider, k8sCreate, K8sResourceKind, OAuthKind } from '../../module/k8s';
import { ButtonBar, ListInput, PromiseComponent, history } from '../utils';
import { addIDP, getOAuthResource, redirectToOAuthPage, mockNames } from './';
import { IDPNameInput } from './idp-name-input';
import { IDPCAFileInput } from './idp-cafile-input';

class AddOpenIDIDPPageWithTranslation extends PromiseComponent<
  AddOpenIDIDPPageProps,
  AddOpenIDIDPPageState
> {
  readonly state: AddOpenIDIDPPageState = {
    name: 'openid',
    clientID: '',
    clientSecret: '',
    claimPreferredUsernames: ['preferred_username'],
    claimNames: ['name'],
    claimEmails: ['email'],
    issuer: '',
    caFileContent: '',
    extraScopes: [],
    inProgress: false,
    errorMessage: '',
  };

  getOAuthResource(): Promise<OAuthKind> {
    return this.handlePromise(getOAuthResource());
  }

  createClientSecret(): Promise<K8sResourceKind> {
    const { clientSecret } = this.state;
    const secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        generateName: 'openid-client-secret-',
        namespace: 'openshift-config',
      },
      stringData: {
        clientSecret,
      },
    };

    return this.handlePromise(k8sCreate(SecretModel, secret));
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
        generateName: 'openid-ca-',
        namespace: 'openshift-config',
      },
      data: {
        'ca.crt': caFileContent,
      },
    };

    return this.handlePromise(k8sCreate(ConfigMapModel, ca));
  }

  addOpenIDIDP(
    oauth: OAuthKind,
    clientSecretName: string,
    caName: string,
    dryRun?: boolean,
  ): Promise<K8sResourceKind> {
    const {
      name,
      clientID,
      issuer,
      extraScopes,
      claimPreferredUsernames,
      claimNames,
      claimEmails,
    } = this.state;
    const idp: IdentityProvider = {
      name,
      type: 'OpenID',
      mappingMethod: 'claim',
      openID: {
        clientID,
        clientSecret: {
          name: clientSecretName,
        },
        issuer,
        extraScopes,
        claims: {
          preferredUsername: claimPreferredUsernames,
          name: claimNames,
          email: claimEmails,
        },
      },
    };

    if (caName) {
      idp.openID.ca = {
        name: caName,
      };
    }

    return this.handlePromise(addIDP(oauth, idp, dryRun));
  }

  submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    // Clear any previous errors.
    this.setState({ errorMessage: '' });
    this.getOAuthResource().then((oauth: OAuthKind) => {
      const mockCA = this.state.caFileContent ? mockNames.ca : '';
      this.addOpenIDIDP(oauth, mockNames.secret, mockCA, true)
        .then(() => {
          const promises = [this.createClientSecret(), this.createCAConfigMap()];

          Promise.all(promises)
            .then(([secret, configMap]) => {
              const caName = configMap ? configMap.metadata.name : '';
              return this.addOpenIDIDP(oauth, secret.metadata.name, caName);
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

  clientIDChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({ clientID: event.currentTarget.value });
  };

  clientSecretChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({ clientSecret: event.currentTarget.value });
  };

  issuerChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({ issuer: event.currentTarget.value });
  };

  claimPreferredUsernamesChanged = (claimPreferredUsernames: string[]) => {
    this.setState({ claimPreferredUsernames });
  };

  claimNamesChanged = (claimNames: string[]) => {
    this.setState({ claimNames });
  };

  claimEmailsChanged = (claimEmails: string[]) => {
    this.setState({ claimEmails });
  };

  extraScopesChanged = (extraScopes: string[]) => {
    this.setState({ extraScopes });
  };

  caFileChanged = (caFileContent: string) => {
    this.setState({ caFileContent });
  };

  render() {
    const {
      name,
      clientID,
      clientSecret,
      issuer,
      claimPreferredUsernames,
      claimNames,
      claimEmails,
      caFileContent,
    } = this.state;
    const { t } = this.props;
    const title = t('openid-idp-form~Add Identity Provider: OpenID Connect');
    return (
      <div className="co-m-pane__body">
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <form onSubmit={this.submit} name="form" className="co-m-pane__body-group co-m-pane__form">
          <h1 className="co-m-pane__heading">{title}</h1>
          <p className="co-m-pane__explanation">
            {t(
              'openid-idp-form~Integrate with an OpenID Connect identity provider using an Authorization Code Flow.',
            )}
          </p>
          <IDPNameInput value={name} onChange={this.nameChanged} />
          <div className="form-group">
            <label className="control-label co-required" htmlFor="client-id">
              {t('openid-idp-form~Client ID')}
            </label>
            <input
              className="pf-c-form-control"
              type="text"
              onChange={this.clientIDChanged}
              value={clientID}
              id="client-id"
              required
            />
          </div>
          <div className="form-group">
            <label className="control-label co-required" htmlFor="client-secret">
              {t('openid-idp-form~Client secret')}
            </label>
            <input
              className="pf-c-form-control"
              type="password"
              onChange={this.clientSecretChanged}
              value={clientSecret}
              id="client-secret"
              required
            />
          </div>
          <div className="form-group">
            <label className="control-label co-required" htmlFor="issuer">
              {t('openid-idp-form~Issuer URL')}
            </label>
            <input
              className="pf-c-form-control"
              type="url"
              onChange={this.issuerChanged}
              value={issuer}
              id="issuer"
              required
              aria-describedby="issuer-help"
            />
            <div className="help-block" id="issuer-help">
              {t(
                'openid-idp-form~The URL that the OpenID provider asserts as its issuer identifier. It must use the https scheme with no URL query parameters or fragment.',
              )}
            </div>
          </div>
          <div className="co-form-section__separator" />
          <h3>{t('openid-idp-form~Claims')}</h3>
          <p className="co-help-text">
            {t(
              'openid-idp-form~Claims map metadata from the OpenID provider to an OpenShift user. The first non-empty claim is used.',
            )}
          </p>
          <ListInput
            label={t('openid-idp-form~Preferred username')}
            initialValues={claimPreferredUsernames}
            onChange={this.claimPreferredUsernamesChanged}
            helpText={t(
              'openid-idp-form~Any scopes to request in addition to the standard openid scope.',
            )}
          />
          <ListInput
            label={t('openid-idp-form~Name')}
            initialValues={claimNames}
            onChange={this.claimNamesChanged}
            helpText={t(
              'openid-idp-form~The list of claims whose values should be used as the display name.',
            )}
          />
          <ListInput
            label={t('openid-idp-form~Email')}
            initialValues={claimEmails}
            onChange={this.claimEmailsChanged}
            helpText={t(
              'openid-idp-form~The list of claims whose values should be used as the email address.',
            )}
          />
          <div className="co-form-section__separator" />
          <h3>More Options</h3>
          <IDPCAFileInput value={caFileContent} onChange={this.caFileChanged} />
          <ListInput
            label={t('openid-idp-form~Extra scopes')}
            onChange={this.extraScopesChanged}
            helpText={t(
              'openid-idp-form~Any scopes to request in addition to the standard openid scope.',
            )}
          />
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

export const AddOpenIDIDPPage = withTranslation()(AddOpenIDIDPPageWithTranslation);

export type AddOpenIDIDPPageState = {
  name: string;
  clientID: string;
  clientSecret: string;
  claimPreferredUsernames: string[];
  claimNames: string[];
  claimEmails: string[];
  issuer: string;
  caFileContent: string;
  extraScopes: string[];
  inProgress: boolean;
  errorMessage: string;
};

type AddOpenIDIDPPageProps = {
  t: TFunction;
};
