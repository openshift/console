import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { ActionGroup, Button } from '@patternfly/react-core';

import { ConfigMapModel } from '../../models';
import { IdentityProvider, k8sCreate, OAuthKind, K8sResourceKind } from '../../module/k8s';
import { ButtonBar, ListInput, history, PageHeading } from '../utils';
import { addIDP, getOAuthResource as getOAuth, redirectToOAuthPage, mockNames } from './';
import { IDPNameInput } from './idp-name-input';
import { IDPCAFileInput } from './idp-cafile-input';

export const AddRequestHeaderPage = () => {
  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [name, setName] = React.useState('request-header');
  const [challengeURL, setChallengeURL] = React.useState('');
  const [loginURL, setLoginURL] = React.useState('');
  const [clientCommonNames, setClientCommonNames] = React.useState([]);
  const [headers, setHeaders] = React.useState([]);
  const [preferredUsernameHeaders, setPreferredUsernameHeaders] = React.useState([]);
  const [nameHeaders, setNameHeaders] = React.useState([]);
  const [emailHeaders, setEmailHeaders] = React.useState([]);
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
        generateName: 'request-header-ca-',
        namespace: 'openshift-config',
      },
      data: {
        'ca.crt': caFileContent,
      },
    };

    return handlePromise(k8sCreate(ConfigMapModel, ca));
  };

  const addRequestHeaderIDP = (oauth: OAuthKind, caName: string, dryRun?: boolean) => {
    const idp: IdentityProvider = {
      name,
      type: 'RequestHeader',
      mappingMethod: 'claim',
      requestHeader: {
        loginURL,
        challengeURL,
        clientCommonNames,
        headers,
        preferredUsernameHeaders,
        nameHeaders,
        emailHeaders,
        ca: {
          name: caName,
        },
      },
    };

    return handlePromise(addIDP(oauth, idp, dryRun));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!caFileContent) {
      setErrorMessage(t('public~You must specify a CA File.'));
      return;
    }

    // Clear any previous errors.
    setErrorMessage('');
    getOAuthResource().then((oauth: OAuthKind) => {
      addRequestHeaderIDP(oauth, mockNames.ca, true)
        .then(() => {
          return createCAConfigMap()
            .then((configMap: K8sResourceKind) =>
              addRequestHeaderIDP(oauth, configMap.metadata.name),
            )
            .then(redirectToOAuthPage);
        })
        .catch((err) => {
          setErrorMessage(err);
        });
    });
  };

  const title = t('public~Add Identity Provider: Request Header');

  return (
    <div className="co-m-pane__form">
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <PageHeading
        title={title}
        helpText={t(
          'public~Use request header to identify users from request header values. It is typically used in combination with an authenticating proxy, which sets the request header value.',
        )}
      />
      <div className="co-m-pane__body">
        <form onSubmit={submit} name="form" className="co-m-pane__body-group">
          <IDPNameInput value={name} onChange={(e) => setName(e.currentTarget.value)} />
          <div className="co-form-section__separator" />
          <h3 className="co-required">{t('public~URLs')}</h3>
          <p className="co-m-pane__explanation">{t('public~At least one URL must be provided.')}</p>
          <div className="form-group">
            <label className="control-label" htmlFor="challenge-url">
              {t('public~Challenge URL')}
            </label>
            <input
              className="pf-c-form-control"
              type="url"
              onChange={(e) => setChallengeURL(e.currentTarget.value)}
              value={challengeURL}
              id="challenge-url"
              aria-describedby="challenge-url-help"
            />
            <div className="help-block" id="challenge-url-help">
              {t(
                'public~The URL to redirect unauthenticated requests from OAuth clients which expect interactive logins.',
              )}
            </div>
          </div>
          <div className="form-group">
            <label className="control-label" htmlFor="login-url">
              {t('public~Login URL')}
            </label>
            <input
              className="pf-c-form-control"
              type="url"
              onChange={(e) => setLoginURL(e.currentTarget.value)}
              value={loginURL}
              id="login-url"
              aria-describedby="login-url-help"
            />
            <div className="help-block" id="login-url-help">
              {t(
                'public~The URL to redirect unauthenticated requests from OAuth clients which expect WWW-Authenticate challenges.',
              )}
            </div>
          </div>
          <div className="co-form-section__separator" />
          <h3>{t('public~More options')}</h3>
          <IDPCAFileInput
            value={caFileContent}
            onChange={(c: string) => setCaFileContent(c)}
            isRequired
          />
          <ListInput
            label={t('public~Client common names')}
            onChange={(c: string[]) => setClientCommonNames(c)}
            helpText={t('public~The set of common names to require a match from.')}
          />
          <ListInput
            label={t('public~Headers')}
            onChange={(c: string[]) => setHeaders(c)}
            helpText={t('public~The set of headers to check for identity information.')}
            required
          />
          <ListInput
            label={t('public~Preferred username headers')}
            onChange={(c: string[]) => setPreferredUsernameHeaders(c)}
            helpText={t('public~The set of headers to check for the preferred username.')}
          />
          <ListInput
            label={t('public~Name headers')}
            onChange={(c: string[]) => setNameHeaders(c)}
            helpText={t('public~The set of headers to check for the display name.')}
          />
          <ListInput
            label={t('public~Email headers')}
            onChange={(c: string[]) => setEmailHeaders(c)}
            helpText={t('public~The set of headers to check for the email address.')}
          />
          <ButtonBar errorMessage={errorMessage} inProgress={inProgress}>
            <ActionGroup className="pf-c-form">
              <Button type="submit" variant="primary">
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

export type AddRequestHeaderPageState = {
  name: string;
  loginURL: string;
  challengeURL: string;
  clientCommonNames: string[];
  headers: string[];
  preferredUsernameHeaders: string[];
  nameHeaders: string[];
  emailHeaders: string[];
  caFileContent: string;
  inProgress: boolean;
  errorMessage: string;
};
