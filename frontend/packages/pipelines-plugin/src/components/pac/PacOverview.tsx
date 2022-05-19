import * as React from 'react';
import {
  Alert,
  AlertActionCloseButton,
  FormGroup,
  Hint,
  HintBody,
  Text,
  TextVariants,
} from '@patternfly/react-core';
import { Helmet } from 'react-helmet';
import { Trans, useTranslation } from 'react-i18next';
import { ExternalLink, ResourceLink, PageHeading } from '@console/internal/components/utils';
import { SecretModel } from '@console/internal/models';
import { SecretKind } from '@console/internal/module/k8s';

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

  const pageTitle = (
    <Helmet>
      <title>{t('pipelines-plugin~GitHub App Details')}</title>
    </Helmet>
  );
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
        <div className="co-m-page__body">
          <div className="co-m-pane__body no-margin">
            <Alert variant="danger" title={t('pipelines-plugin~Something unexpected happened!!')}>
              {loadError?.message && <p>{loadError.message}</p>}
            </Alert>
          </div>
        </div>
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
      <div className="co-m-page__body">
        <div className="co-m-pane__body no-margin">
          {alertVisible && (
            <Alert
              variant="success"
              title={t('pipelines-plugin~You have successfully setup the GitHub App')}
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
          {!showSuccessAlert && annotations?.appUrl && (
            <Hint>
              <HintBody>
                <Trans t={t} ns="pipelines-plugin">
                  Use this{' '}
                  <a href={annotations.appUrl} target="_blank" rel="noopener noreferrer">
                    link
                  </a>{' '}
                  to install the GitHub Application to your repositories in your
                  organization/account.
                </Trans>
              </HintBody>
            </Hint>
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
      </div>
    </>
  );
};

export default PacOverview;
