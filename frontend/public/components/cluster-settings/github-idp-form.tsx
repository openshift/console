import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation, Trans } from 'react-i18next';
import { ActionGroup, Button } from '@patternfly/react-core';

import { SecretModel, ConfigMapModel } from '../../models';
import { IdentityProvider, k8sCreate, OAuthKind } from '../../module/k8s';
import { ButtonBar, ListInput, history, PageHeading } from '../utils';
import { addIDP, getOAuthResource as getOAuth, redirectToOAuthPage, mockNames } from './';
import { IDPNameInput } from './idp-name-input';
import { IDPCAFileInput } from './idp-cafile-input';

export const AddGitHubPage = () => {
  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [name, setName] = React.useState('github');
  const [clientID, setClientID] = React.useState('');
  const [clientSecret, setClientSecret] = React.useState('');
  const [hostname, setHostname] = React.useState('');
  const [organizations, setOrganizations] = React.useState([]);
  const [teams, setTeams] = React.useState([]);
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
            .then(redirectToOAuthPage);
        })
        .catch((err) => {
          setErrorMessage(err);
        });
    });
  };

  const title = t('public~Add Identity Provider: GitHub');

  return (
    <div className="co-m-pane__form">
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <PageHeading
        title={title}
        helpText={t(
          'public~You can use the GitHub integration to connect to either GitHub or GitHub Enterprise. For GitHub Enterprise, you must provide the hostname of your instance and can optionally provide a CA certificate bundle to use in requests to the server.',
        )}
      />
      <div className="co-m-pane__body">
        <form onSubmit={submit} name="form" className="co-m-pane__body-group">
          <IDPNameInput value={name} onChange={(e) => setName(e.currentTarget.value)} />
          <div className="form-group">
            <label className="control-label co-required" htmlFor="client-id">
              {t('public~Client ID')}
            </label>
            <input
              className="pf-c-form-control"
              type="text"
              onChange={(e) => setClientID(e.currentTarget.value)}
              value={clientID}
              id="client-id"
              required
            />
          </div>
          <div className="form-group">
            <label className="control-label co-required" htmlFor="client-secret">
              {t('public~Client secret')}
            </label>
            <input
              className="pf-c-form-control"
              type="password"
              onChange={(e) => setClientSecret(e.currentTarget.value)}
              value={clientSecret}
              id="client-secret"
              required
            />
          </div>
          <div className="form-group">
            <label className="control-label" htmlFor="hostname">
              {t('public~Hostname')}
            </label>
            <input
              className="pf-c-form-control"
              type="text"
              onChange={(e) => setHostname(e.currentTarget.value)}
              value={hostname}
              id="hostname"
              aria-describedby="idp-hostname-help"
            />
            <p className="help-block" id="idp-hostname-help">
              {t('public~Optional domain for use with a hosted instance of GitHub Enterprise.')}
            </p>
          </div>
          <IDPCAFileInput value={caFileContent} onChange={(c: string) => setCaFileContent(c)} />
          <div className="co-form-section__separator" />
          <h3>{t('public~Organizations')}</h3>
          <p className="co-help-text">
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
            onChange={(c: string[]) => setOrganizations(c)}
            helpText={t('public~Restricts which organizations are allowed to log in.')}
          />
          <div className="co-form-section__separator" />
          <h3>{t('public~Teams')}</h3>
          <p className="co-help-text">
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
            onChange={(c: string[]) => setTeams(c)}
            helpText={t(
              'public~Restricts which teams are allowed to log in. The format is <org>/<team>.',
            )}
          />
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
