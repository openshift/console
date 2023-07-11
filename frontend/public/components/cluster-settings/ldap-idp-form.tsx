import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { ActionGroup, Button } from '@patternfly/react-core';

import { ConfigMapModel, SecretModel } from '../../models';
import { IdentityProvider, k8sCreate, OAuthKind } from '../../module/k8s';
import { ButtonBar, ListInput, history, PageHeading } from '../utils';
import { addIDP, getOAuthResource as getOAuth, redirectToOAuthPage, mockNames } from './';
import { IDPNameInput } from './idp-name-input';
import { IDPCAFileInput } from './idp-cafile-input';

export const AddLDAPPage = () => {
  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [name, setName] = React.useState('ldap');
  const [url, setUrl] = React.useState('');
  const [bindDN, setBindDN] = React.useState('');
  const [bindPassword, setBindPassword] = React.useState('');
  const [attributesID, setAttributesID] = React.useState(['dn']);
  const [attributesPreferredUsername, setAttributesPreferredUsername] = React.useState(['uid']);
  const [attributesName, setAttributesName] = React.useState(['cn']);
  const [attributesEmail, setAttributesEmail] = React.useState([]);
  const [caFileContent, setCaFileContent] = React.useState('');

  const { t } = useTranslation();

  const thenPromise = (res) => {
    setInProgress(false);
    setErrorMessage('');
    return res;
  };

  const catchError = (error) => {
    const err = error.message || t('public~An error occurred. Please try again.');
    setInProgress(false);
    setErrorMessage(err);
    return Promise.reject(err);
  };

  const handlePromise = (promise) => {
    setInProgress(true);

    return promise.then(
      (res) => thenPromise(res),
      (error) => catchError(error),
    );
  };

  const getOAuthResource = () => {
    return handlePromise(getOAuth());
  };

  const createCAConfigMap = () => {
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

    return handlePromise(k8sCreate(ConfigMapModel, ca));
  };

  const createBindPasswordSecret = () => {
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

    return handlePromise(k8sCreate(SecretModel, secret));
  };

  const addLDAPIDP = (
    oauth: OAuthKind,
    bindPasswordSecretName: string,
    caConfigMapName: string,
    dryRun?: boolean,
  ) => {
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

    return handlePromise(addIDP(oauth, idp, dryRun));
  };

  const submit = (e) => {
    e.preventDefault();
    // Clear any previous errors.
    setErrorMessage('');
    getOAuthResource().then((oauth: OAuthKind) => {
      const mockSecret = bindPassword ? mockNames.secret : '';
      const mockCA = caFileContent ? mockNames.ca : '';
      addLDAPIDP(oauth, mockSecret, mockCA, true)
        .then(() => {
          const promises = [createBindPasswordSecret(), createCAConfigMap()];

          Promise.all(promises)
            .then(([bindPasswordSecret, caConfigMap]) => {
              const bindPasswordSecretName = _.get(bindPasswordSecret, 'metadata.name');
              const caConfigMapName = _.get(caConfigMap, 'metadata.name');
              return addLDAPIDP(oauth, bindPasswordSecretName, caConfigMapName);
            })
            .then(redirectToOAuthPage);
        })
        .catch((err) => {
          setErrorMessage(err);
        });
    });
  };

  const title = t('public~Add Identity Provider: LDAP');

  return (
    <div className="co-m-pane__form">
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <PageHeading title={title} helpText={t('public~Integrate with an LDAP identity provider.')} />
      <div className="co-m-pane__body">
        <form onSubmit={submit} name="form" className="co-m-pane__body-group">
          <IDPNameInput value={name} onChange={(e) => setName(e.currentTarget.value)} />
          <div className="form-group">
            <label className="control-label co-required" htmlFor="url">
              {t('public~URL')}
            </label>
            <input
              className="pf-c-form-control"
              type="url"
              onChange={(e) => setUrl(e.currentTarget.value)}
              value={url}
              id="url"
              required
              aria-describedby="url-help"
            />
            <div className="help-block" id="url-help">
              {t('public~An RFC 2255 URL which specifies the LDAP search parameters to use.')}
            </div>
          </div>
          <div className="form-group">
            <label className="control-label" htmlFor="bind-dn">
              {t('public~Bind DN')}
            </label>
            <input
              className="pf-c-form-control"
              type="text"
              onChange={(e) => setBindDN(e.currentTarget.value)}
              value={bindDN}
              id="bind-dn"
              aria-describedby="bind-dn-help"
            />
            <div className="help-block" id="bind-dn-help">
              {t('public~DN to bind with during the search phase.')}
            </div>
          </div>
          <div className="form-group">
            <label className="control-label" htmlFor="bind-password">
              {t('public~Bind password')}
            </label>
            <input
              className="pf-c-form-control"
              type="password"
              onChange={(e) => setBindPassword(e.currentTarget.value)}
              value={bindPassword}
              id="bind-password"
              aria-describedby="bind-password-help"
            />
            <div className="help-block" id="bind-password-help">
              {t('public~Password to bind with during the search phase.')}
            </div>
          </div>
          <div className="co-form-section__separator" />
          <h3>{t('public~Attributes')}</h3>
          <p className="co-help-text">
            {t('public~Attributes map LDAP attributes to identities.')}
          </p>
          <ListInput
            label={t('public~ID')}
            required
            initialValues={attributesID}
            onChange={(c: string[]) => setAttributesID(c)}
            helpText={t(
              'public~The list of attributes whose values should be used as the user ID.',
            )}
          />
          <ListInput
            label={t('public~Preferred username')}
            initialValues={attributesPreferredUsername}
            onChange={(c: string[]) => setAttributesPreferredUsername(c)}
            helpText={t(
              'public~The list of attributes whose values should be used as the preferred username.',
            )}
          />
          <ListInput
            label={t('public~Name')}
            initialValues={attributesName}
            onChange={(c: string[]) => setAttributesName(c)}
            helpText={t(
              'public~The list of attributes whose values should be used as the display name.',
            )}
          />
          <ListInput
            label={t('public~Email')}
            onChange={(c: string[]) => setAttributesEmail(c)}
            helpText={t(
              'public~The list of attributes whose values should be used as the email address.',
            )}
          />
          <div className="co-form-section__separator" />
          <h3>{t('public~More options')}</h3>
          <IDPCAFileInput value={caFileContent} onChange={(c: string) => setCaFileContent(c)} />
          <ButtonBar errorMessage={errorMessage} inProgress={inProgress}>
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
    </div>
  );
};

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
