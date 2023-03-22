import * as React from 'react';
import { Helmet } from 'react-helmet';
import { withTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { ActionGroup, Button } from '@patternfly/react-core';

import { SecretModel } from '../../models';
import { IdentityProvider, k8sCreate, K8sResourceKind, OAuthKind } from '../../module/k8s';
import { AsyncComponent, ButtonBar, PromiseComponent, history, PageHeading } from '../utils';
import { addIDP, getOAuthResource, redirectToOAuthPage, mockNames } from './';
import { IDPNameInput } from './idp-name-input';
import { ClusterContext } from '@console/app/src/components/detect-cluster/cluster';

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

  static contextType = ClusterContext;
  context!: React.ContextType<typeof ClusterContext>;

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
    const { cluster } = this.context;
    if (!this.state.htpasswdFileContent) {
      this.setState({
        errorMessage: this.props.t('public~You must specify an HTPasswd file.'),
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
            .then(() => redirectToOAuthPage(cluster));
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
          <form onSubmit={this.submit} name="form" className="co-m-pane__body-group">
            <IDPNameInput value={name} onChange={this.nameChanged} />
            <div className="form-group">
              <DroppableFileInput
                onChange={this.htpasswdFileChanged}
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
