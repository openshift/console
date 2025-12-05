import { useState } from 'react';
import * as _ from 'lodash-es';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { ActionGroup, Button, Title } from '@patternfly/react-core';

import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { ConfigMapModel, SecretModel } from '../../models';
import { IdentityProvider, k8sCreate, OAuthKind } from '../../module/k8s';
import { ButtonBar } from '../utils/button-bar';
import { ListInput } from '../utils/list-input';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { addIDP, getOAuthResource as getOAuth, redirectToOAuthPage, mockNames } from './';
import { IDPNameInput } from './idp-name-input';
import { IDPCAFileInput } from './idp-cafile-input';

export const AddLDAPPage = () => {
  const navigate = useNavigate();
  const [inProgress, setInProgress] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [name, setName] = useState('ldap');
  const [url, setUrl] = useState('');
  const [bindDN, setBindDN] = useState('');
  const [bindPassword, setBindPassword] = useState('');
  const [attributesID, setAttributesID] = useState(['dn']);
  const [attributesPreferredUsername, setAttributesPreferredUsername] = useState(['uid']);
  const [attributesName, setAttributesName] = useState(['cn']);
  const [attributesEmail, setAttributesEmail] = useState([]);
  const [caFileContent, setCaFileContent] = useState('');

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
            .then(() => {
              redirectToOAuthPage(navigate);
            });
        })
        .catch((err) => {
          setErrorMessage(err);
        });
    });
  };

  const title = t('public~Add Identity Provider: LDAP');

  return (
    <div className="co-m-pane__form">
      <DocumentTitle>{title}</DocumentTitle>
      <PageHeading title={title} helpText={t('public~Integrate with an LDAP identity provider.')} />
      <PaneBody>
        <form onSubmit={submit} name="form">
          <IDPNameInput value={name} onChange={(e) => setName(e.currentTarget.value)} />
          <div className="form-group">
            <label className="co-required" htmlFor="url">
              {t('public~URL')}
            </label>
            <span className="pf-v6-c-form-control">
              <input
                type="url"
                aria-label={t('public~URL')}
                onChange={(e) => setUrl(e.currentTarget.value)}
                value={url}
                id="url"
                required
                aria-describedby="url-help"
              />
            </span>
            <div className="help-block" id="url-help">
              {t('public~An RFC 2255 URL which specifies the LDAP search parameters to use.')}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="bind-dn">{t('public~Bind DN')}</label>
            <span className="pf-v6-c-form-control">
              <input
                type="text"
                aria-label={t('public~Bind DN')}
                onChange={(e) => setBindDN(e.currentTarget.value)}
                value={bindDN}
                id="bind-dn"
                aria-describedby="bind-dn-help"
              />
            </span>
            <div className="help-block" id="bind-dn-help">
              {t('public~DN to bind with during the search phase.')}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="bind-password">{t('public~Bind password')}</label>
            <span className="pf-v6-c-form-control">
              <input
                type="password"
                aria-label={t('public~Bind password')}
                onChange={(e) => setBindPassword(e.currentTarget.value)}
                value={bindPassword}
                id="bind-password"
                aria-describedby="bind-password-help"
              />
            </span>
            <div className="help-block" id="bind-password-help">
              {t('public~Password to bind with during the search phase.')}
            </div>
          </div>
          <div className="co-form-section__separator" />
          <div>
            <Title headingLevel="h3" className="pf-v6-u-mb-sm">
              {t('public~Attributes')}
            </Title>
            <p>{t('public~Attributes map LDAP attributes to identities.')}</p>
            <ListInput
              label={t('public~ID')}
              id="ldap-attribute-id"
              required
              initialValues={attributesID}
              onChange={(c: string[]) => setAttributesID(c)}
              helpText={t(
                'public~The list of attributes whose values should be used as the user ID.',
              )}
            />
            <ListInput
              label={t('public~Preferred username')}
              id="ldap-attribute-preferred-username"
              initialValues={attributesPreferredUsername}
              onChange={(c: string[]) => setAttributesPreferredUsername(c)}
              helpText={t(
                'public~The list of attributes whose values should be used as the preferred username.',
              )}
            />
            <ListInput
              label={t('public~Name')}
              id="ldap-attribute-name"
              initialValues={attributesName}
              onChange={(c: string[]) => setAttributesName(c)}
              helpText={t(
                'public~The list of attributes whose values should be used as the display name.',
              )}
            />
            <ListInput
              label={t('public~Email')}
              id="ldap-attribute-email"
              onChange={(c: string[]) => setAttributesEmail(c)}
              helpText={t(
                'public~The list of attributes whose values should be used as the email address.',
              )}
            />
            <div className="co-form-section__separator" />
            <Title headingLevel="h3" className="pf-v6-u-mb-sm">
              {t('public~More options')}
            </Title>
            <IDPCAFileInput
              id="ca-file-input"
              value={caFileContent}
              onChange={(c: string) => setCaFileContent(c)}
            />
          </div>
          <ButtonBar errorMessage={errorMessage} inProgress={inProgress}>
            <ActionGroup className="pf-v6-c-form">
              <Button type="submit" variant="primary" data-test-id="add-idp">
                {t('public~Add')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
                {t('public~Cancel')}
              </Button>
            </ActionGroup>
          </ButtonBar>
        </form>
      </PaneBody>
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
