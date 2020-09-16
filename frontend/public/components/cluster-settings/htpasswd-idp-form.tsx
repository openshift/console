import * as React from 'react';
import { Helmet } from 'react-helmet';
import { withTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { ActionGroup, Button } from '@patternfly/react-core';

import { SecretModel } from '../../models';
import { IdentityProvider, k8sCreate, K8sResourceKind, OAuthKind } from '../../module/k8s';
import { AsyncComponent, ButtonBar, PromiseComponent, history } from '../utils';
import { addIDP, getOAuthResource, redirectToOAuthPage, mockNames } from './';
import { IDPNameInput } from './idp-name-input';

export const DroppableFileInput = (props: any) => (
  <AsyncComponent
    loader={() => import('../utils/file-input').then((c) => c.DroppableFileInput)}
    {...props}
  />
);

class AddHTPasswdPageWithTranslation extends PromiseComponent<
  AddHTPasswdPageProps,
  AddHTPasswdPageState
> {
  readonly state: AddHTPasswdPageState = {
    name: 'htpasswd',
    htpasswdFileContent: '',
    inProgress: false,
    errorMessage: '',
  };

  getOAuthResource(): Promise<OAuthKind> {
    return this.handlePromise(getOAuthResource());
  }

  createHTPasswdSecret(): Promise<K8sResourceKind> {
    const secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        generateName: 'htpasswd-',
        namespace: 'openshift-config',
      },
      stringData: {
        htpasswd: this.state.htpasswdFileContent,
      },
    };

    return this.handlePromise(k8sCreate(SecretModel, secret));
  }

  addHTPasswdIDP(oauth: OAuthKind, secretName: string, dryRun?: boolean): Promise<K8sResourceKind> {
    const { name } = this.state;
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

    return this.handlePromise(addIDP(oauth, idp, dryRun));
  }

  submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!this.state.htpasswdFileContent) {
      this.setState({
        errorMessage: this.props.t('htpasswd-idp-form~You must specify an HTPasswd file.'),
      });
      return;
    }

    // Clear any previous errors.
    this.setState({ errorMessage: '' });
    this.getOAuthResource().then((oauth: OAuthKind) => {
      this.addHTPasswdIDP(oauth, mockNames.secret, true)
        .then(() => {
          return this.createHTPasswdSecret()
            .then((secret: K8sResourceKind) => this.addHTPasswdIDP(oauth, secret.metadata.name))
            .then(redirectToOAuthPage);
        })
        .catch((err) => {
          this.setState({ errorMessage: err });
        });
    });
  };

  nameChanged: React.ReactEventHandler<HTMLInputElement> = (e) => {
    this.setState({ name: e.currentTarget.value });
  };

  htpasswdFileChanged = (htpasswdFileContent: string) => {
    this.setState({ htpasswdFileContent });
  };

  render() {
    const { name, htpasswdFileContent } = this.state;
    const { t } = this.props;
    const title = t('htpasswd-idp-form~Add Identity Provider: HTPasswd');

    return (
      <div className="co-m-pane__body">
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <form onSubmit={this.submit} name="form" className="co-m-pane__body-group co-m-pane__form">
          <h1 className="co-m-pane__heading">{title}</h1>
          <p className="co-m-pane__explanation">
            {t(
              'htpasswd-idp-form~HTPasswd validates usernames and passwords against a flat file generated using the htpasswd command.',
            )}
          </p>
          <IDPNameInput value={name} onChange={this.nameChanged} />
          <div className="form-group">
            <DroppableFileInput
              onChange={this.htpasswdFileChanged}
              inputFileData={htpasswdFileContent}
              id="htpasswd-file"
              label={t('htpasswd-idp-form~HTPasswd file')}
              inputFieldHelpText={t(
                'htpasswd-idp-form~Upload an HTPasswd file created using the htpasswd command.',
              )}
              isRequired
              hideContents
            />
          </div>
          <ButtonBar errorMessage={this.state.errorMessage} inProgress={this.state.inProgress}>
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
    );
  }
}

export const AddHTPasswdPage = withTranslation()(AddHTPasswdPageWithTranslation);

export type AddHTPasswdPageState = {
  name: string;
  htpasswdFileContent: string;
  inProgress: boolean;
  errorMessage: string;
};

type AddHTPasswdPageProps = {
  t: TFunction;
};
