import { useState } from 'react';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { ActionGroup, Button, Title } from '@patternfly/react-core';

import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { SecretModel, ConfigMapModel } from '../../models';
import { IdentityProvider, k8sCreate, OAuthKind } from '../../module/k8s';
import { ButtonBar, ListInput } from '../utils';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { addIDP, getOAuthResource as getOAuth, redirectToOAuthPage, mockNames } from './';
import { IDPNameInput } from './idp-name-input';
import { IDPCAFileInput } from './idp-cafile-input';

export const AddGitHubPage = () => {
  const navigate = useNavigate();
  const [inProgress, setInProgress] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [name, setName] = useState('github');
  const [clientID, setClientID] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [hostname, setHostname] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [teams, setTeams] = useState([]);
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

  const createClientSecret = () => {
    const secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        generateName: 'github-client-secret-',
        namespace: 'openshift-config',
      },
      stringData: {
        clientSecret,
      },
    };

    return handlePromise(k8sCreate(SecretModel, secret));
  };

  const createCAConfigMap = () => {
    if (!caFileContent) {
      return Promise.resolve(null);
    }

    const ca = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        generateName: 'github-ca-',
        namespace: 'openshift-config',
      },
      data: {
        'ca.crt': caFileContent,
      },
    };

    return handlePromise(k8sCreate(ConfigMapModel, ca));
  };

  const addGitHubIDP = (
    oauth: OAuthKind,
    clientSecretName: string,
    caName: string,
    dryRun?: boolean,
  ) => {
    const idp: IdentityProvider = {
      name,
      type: 'GitHub',
      mappingMethod: 'claim',
      github: {
        clientID,
        clientSecret: {
          name: clientSecretName,
        },
        hostname,
        organizations,
        teams,
      },
    };

    if (caName) {
      idp.github.ca = {
        name: caName,
      };
    }

    return handlePromise(addIDP(oauth, idp, dryRun));
  };

  const submit = (e) => {
    e.preventDefault();
    if (organizations.length > 0 && teams.length > 0) {
      setErrorMessage(t('public~Specify either organizations or teams, but not both.'));
      return;
    }

    // Clear any previous errors.
    setErrorMessage('');
    getOAuthResource().then((oauth: OAuthKind) => {
      const mockCA = caFileContent ? mockNames.ca : '';
      addGitHubIDP(oauth, mockNames.secret, mockCA, true)
        .then(() => {
          const promises = [createClientSecret(), createCAConfigMap()];

          Promise.all(promises)
            .then(([secret, configMap]) => {
              const caName = configMap ? configMap.metadata.name : '';
              return addGitHubIDP(oauth, secret.metadata.name, caName);
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

  const title = t('public~Add Identity Provider: GitHub');

  return (
    <div className="co-m-pane__form">
      <DocumentTitle>{title}</DocumentTitle>
      <PageHeading
        title={title}
        helpText={t(
          'public~You can use the GitHub integration to connect to either GitHub or GitHub Enterprise. For GitHub Enterprise, you must provide the hostname of your instance and can optionally provide a CA certificate bundle to use in requests to the server.',
        )}
      />
      <PaneBody>
        <form onSubmit={submit} name="form">
          <IDPNameInput value={name} onChange={(e) => setName(e.currentTarget.value)} />
          <div className="form-group">
            <label className="co-required" htmlFor="client-id">
              {t('public~Client ID')}
            </label>
            <span className="pf-v6-c-form-control">
              <input
                type="text"
                aria-label={t('public~Client ID')}
                onChange={(e) => setClientID(e.currentTarget.value)}
                value={clientID}
                id="client-id"
                required
              />
            </span>
          </div>
          <div className="form-group">
            <label className="co-required" htmlFor="client-secret">
              {t('public~Client secret')}
            </label>
            <span className="pf-v6-c-form-control">
              <input
                type="password"
                aria-label={t('public~Client secret')}
                onChange={(e) => setClientSecret(e.currentTarget.value)}
                value={clientSecret}
                id="client-secret"
                required
              />
            </span>
          </div>
          <div className="form-group">
            <label htmlFor="hostname">{t('public~Hostname')}</label>
            <span className="pf-v6-c-form-control">
              <input
                type="text"
                aria-label={t('public~Hostname')}
                onChange={(e) => setHostname(e.currentTarget.value)}
                value={hostname}
                id="hostname"
                aria-describedby="idp-hostname-help"
              />
            </span>
            <p className="help-block" id="idp-hostname-help">
              {t('public~Optional domain for use with a hosted instance of GitHub Enterprise.')}
            </p>
          </div>
          <IDPCAFileInput
            id="ca-file-input"
            value={caFileContent}
            onChange={(c: string) => setCaFileContent(c)}
          />
          <div className="co-form-section__separator" />
          <Title headingLevel="h3" className="pf-v6-u-mb-sm">
            {t('public~Organizations')}
          </Title>
          <p>
            <Trans
              t={t}
              ns="public"
              i18nKey="Optionally list organizations. If specified, only GitHub users that are members of at least one of the listed organizations will be allowed to log in. Cannot be used in combination with <strong>teams</strong>."
            >
              Optionally list organizations. If specified, only GitHub users that are members of at
              least one of the listed organizations will be allowed to log in. Cannot be used in
              combination with <strong>teams</strong>.
            </Trans>
          </p>
          <ListInput
            label={t('public~Organization')}
            id="organization-list-input"
            onChange={(c: string[]) => setOrganizations(c)}
            helpText={t('public~Restricts which organizations are allowed to log in.')}
          />
          <div className="co-form-section__separator" />
          <Title headingLevel="h3" className="pf-v6-u-mb-sm">
            {t('public~Teams')}
          </Title>
          <p>
            <Trans
              t={t}
              ns="public"
              i18nKey="Optionally list teams. If specified, only GitHub users that are members of at least one of the listed teams will be allowed to log in. Cannot be used in combination with <strong>organizations</strong>."
            >
              Optionally list teams. If specified, only GitHub users that are members of at least
              one of the listed teams will be allowed to log in. Cannot be used in combination with{' '}
              <strong>organizations</strong>.
            </Trans>
          </p>
          <ListInput
            label={t('public~Team')}
            id="team-list-input"
            onChange={(c: string[]) => setTeams(c)}
            helpText={t(
              'public~Restricts which teams are allowed to log in. The format is <org>/<team>.',
            )}
          />
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

export type AddGitHubPageState = {
  name: string;
  clientID: string;
  clientSecret: string;
  hostname: string;
  organizations: string[];
  teams: string[];
  caFileContent: string;
  inProgress: boolean;
  errorMessage: string;
};
