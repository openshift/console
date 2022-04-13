import * as React from 'react';
import {
  Alert,
  AlertActionCloseButton,
  FormGroup,
  Text,
  TextVariants,
} from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { ExternalLink, ResourceLink, PageHeading } from '@console/internal/components/utils';
import { SecretModel } from '@console/internal/models';
import { SecretKind } from '@console/internal/module/k8s';

const PacOverview: React.FC<{ namespace: string; secret?: SecretKind; loadError?: Error }> = ({
  namespace,
  secret,
  loadError,
}) => {
  const { t } = useTranslation();
  const [alertVisible, setAlertVisible] = React.useState(!!secret?.metadata && !loadError && true);

  const pageHeading = (
    <PageHeading
      title={t('pipelines-plugin~Configure Pipelines as Code')}
      breadcrumbs={[
        {
          name: t('pipelines-plugin~Configure Pipelines as Code'),
          path: `/pipelines/ns/${namespace}`,
        },
        { name: t('pipelines-plugin~Application details'), path: undefined },
      ]}
    />
  );
  if (loadError || !secret?.metadata) {
    return (
      <>
        {pageHeading}
        <div className="co-m-pane__body">
          <Alert variant="danger" title={t('pipelines-plugin~Something unexpected happened!!')}>
            {loadError?.message && <p>{loadError.message}</p>}
          </Alert>
        </div>
      </>
    );
  }

  const {
    metadata: { name, namespace: secretNs, annotations },
  } = secret;

  return (
    <>
      {pageHeading}
      <div className="co-m-pane__body">
        {alertVisible && (
          <Alert
            variant="success"
            title={t(
              'pipelines-plugin~You have successfully bootstrapped pipelines as code in the cluster',
            )}
            actionClose={<AlertActionCloseButton onClose={() => setAlertVisible(false)} />}
          >
            {annotations?.appUrl && (
              <Trans t={t} ns="pipelines-plugin">
                <p>
                  Use the{' '}
                  <a href={annotations.appUrl} target="_blank" rel="noopener noreferrer">
                    link
                  </a>{' '}
                  to install the newly created GitHub application to your repositories in your
                  organization/account
                </p>
              </Trans>
            )}
          </Alert>
        )}
        <br />
        <FormGroup fieldId="app-overview">
          {annotations?.appName && (
            <FormGroup label={t('pipelines-plugin~App Name')} fieldId="app-name">
              <Text component={TextVariants.small}>{annotations.appName}</Text>
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
      </div>
    </>
  );
};

export default PacOverview;
