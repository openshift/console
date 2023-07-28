import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { ActionGroup, Button } from '@patternfly/react-core';

import { SecretModel } from '../../models';
import { IdentityProvider, k8sCreate, K8sResourceKind, OAuthKind } from '../../module/k8s';
import { AsyncComponent, ButtonBar, history, PageHeading } from '../utils';
import { addIDP, getOAuthResource as getOAuth, redirectToOAuthPage, mockNames } from './';
import { IDPNameInput } from './idp-name-input';

export const DroppableFileInput = (props: any) => (
  <AsyncComponent
    loader={() => import('../utils/file-input').then((c) => c.DroppableFileInput)}
    {...props}
  />
);

export const AddHTPasswdPage = () => {
  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [name, setName] = React.useState('htpasswd');
  const [htpasswdFileContent, setHtpasswdFileContent] = React.useState('');

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

  const createHTPasswdSecret = () => {
    const secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        generateName: 'htpasswd-',
        namespace: 'openshift-config',
      },
      stringData: {
        htpasswd: htpasswdFileContent,
      },
    };

    return handlePromise(k8sCreate(SecretModel, secret));
  };

  const addHTPasswdIDP = (oauth: OAuthKind, secretName: string, dryRun?: boolean) => {
    const idp: IdentityProvider = {
      name,
      type: 'HTPasswd',
      mappingMethod: 'claim',
      htpasswd: {
        fileData: {
          name: secretName,
        },
      },
    };

    return handlePromise(addIDP(oauth, idp, dryRun));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!htpasswdFileContent) {
      setErrorMessage(t('public~You must specify an HTPasswd file.'));
      return;
    }

    // Clear any previous errors.
    setErrorMessage('');
    getOAuthResource().then((oauth: OAuthKind) => {
      addHTPasswdIDP(oauth, mockNames.secret, true)
        .then(() => {
          return createHTPasswdSecret()
            .then((secret: K8sResourceKind) => addHTPasswdIDP(oauth, secret.metadata.name))
            .then(redirectToOAuthPage);
        })
        .catch((err) => {
          setErrorMessage(err);
        });
    });
  };

  const title = t('public~Add Identity Provider: HTPasswd');

  return (
    <div className="co-m-pane__form">
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <PageHeading
        title={title}
        helpText={t(
          'public~HTPasswd validates usernames and passwords against a flat file generated using the htpasswd command.',
        )}
      />
      <div className="co-m-pane__body">
        <form onSubmit={submit} name="form" className="co-m-pane__body-group">
          <IDPNameInput value={name} onChange={(e) => setName(e.currentTarget.value)} />
          <div className="form-group">
            <DroppableFileInput
              onChange={(c: string) => setHtpasswdFileContent(c)}
              inputFileData={htpasswdFileContent}
              id="htpasswd-file"
              label={t('public~HTPasswd file')}
              inputFieldHelpText={t(
                'public~Upload an HTPasswd file created using the htpasswd command.',
              )}
              isRequired
              hideContents
            />
          </div>
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

export type AddHTPasswdPageState = {
  name: string;
  htpasswdFileContent: string;
  inProgress: boolean;
  errorMessage: string;
};
