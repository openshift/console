import * as React from 'react';
import {
  Alert,
  AlertActionCloseButton,
  FormGroup,
  Hint,
  HintBody,
  Content,
  ContentVariants,
} from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { ExternalLink, ResourceLink } from '@console/internal/components/utils';
import { SecretModel } from '@console/internal/models';
import { SecretKind } from '@console/internal/module/k8s';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import PageBody from '@console/shared/src/components/layout/PageBody';
import PaneBody from '@console/shared/src/components/layout/PaneBody';

type PacOverviewProps = {
  namespace: string;
  secret?: SecretKind;
  loadError?: Error;
  showSuccessAlert?: boolean;
};

const PacOverview: React.FC<PacOverviewProps> = ({
  namespace,
  secret,
  loadError,
  showSuccessAlert = false,
}) => {
  const { t } = useTranslation();
  const [alertVisible, setAlertVisible] = React.useState<boolean>(showSuccessAlert);

  React.useEffect(() => {
    setAlertVisible(showSuccessAlert);
  }, [showSuccessAlert]);

  const pageTitle = <DocumentTitle>{t('pipelines-plugin~GitHub App Details')}</DocumentTitle>;
  const pageHeading = (
    <PageHeading
      title={t('pipelines-plugin~GitHub App Details')}
      breadcrumbs={[
        {
          name: t('pipelines-plugin~Pipelines'),
          path: `/pipelines/ns/${namespace}`,
        },
        { name: t('pipelines-plugin~GitHub App details'), path: undefined },
      ]}
    />
  );
  if (loadError || !secret?.metadata) {
    return (
      <>
        {pageTitle}
        {pageHeading}
        <PageBody>
          <PaneBody>
            <Alert variant="danger" title={t('pipelines-plugin~Something unexpected happened!!')}>
              {loadError?.message && <p>{loadError.message}</p>}
            </Alert>
          </PaneBody>
        </PageBody>
      </>
    );
  }

  const {
    metadata: { name, namespace: secretNs, annotations },
  } = secret;

  return (
    <>
      {pageTitle}
      {pageHeading}
      <PageBody>
        <PaneBody>
          {alertVisible && (
            <Alert
              variant="success"
              title={t('pipelines-plugin~You have successfully setup the GitHub App')}
              actionClose={<AlertActionCloseButton onClose={() => setAlertVisible(false)} />}
            >
              {annotations?.appUrl && (
                <Trans t={t} ns="pipelines-plugin">
                  <p>
                    Use the <ExternalLink href={annotations.appUrl}>link</ExternalLink> to install
                    the newly created GitHub application to your repositories in your
                    organization/account
                  </p>
                </Trans>
              )}
            </Alert>
          )}
          {!showSuccessAlert && annotations?.appUrl && (
            <Hint>
              <HintBody>
                <Trans t={t} ns="pipelines-plugin">
                  Use this <ExternalLink href={annotations.appUrl}>link</ExternalLink> to install
                  the GitHub Application to your repositories in your organization/account.
                </Trans>
              </HintBody>
            </Hint>
          )}
          <br />
          <FormGroup fieldId="app-overview">
            {annotations?.appName && (
              <FormGroup label={t('pipelines-plugin~App Name')} fieldId="app-name">
                <Content component={ContentVariants.small}>{annotations.appName}</Content>
              </FormGroup>
            )}
            <br />
            {annotations?.appUrl && (
              <FormGroup label={t('pipelines-plugin~App Link')} fieldId="app-link">
                <ExternalLink text={annotations.appUrl} href={annotations.appUrl} />
              </FormGroup>
            )}
            <br />
            <FormGroup label={t('pipelines-plugin~Secret')} fieldId="res-secret">
              <ResourceLink kind={SecretModel.kind} name={name} namespace={secretNs} />
            </FormGroup>
            <br />
          </FormGroup>
        </PaneBody>
      </PageBody>
    </>
  );
};

export default PacOverview;
