import type { FC } from 'react';
import { useState } from 'react';
import { Form } from '@patternfly/react-core';
import type { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import {
  ContainerSelect,
  documentationURLs,
  getDocumentationURL,
  isManaged,
  ResourceLink,
} from '@console/internal/components/utils';
import { ContainerModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceFor, modelFor } from '@console/internal/module/k8s';
import { FormFooter } from '@console/shared';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { ExternalLinkButton } from '@console/shared/src/components/links/ExternalLinkButton';
import { getResourcesType } from '../edit-application/edit-application-utils';
import { getHealthChecksData } from './create-health-checks-probe-utils';
import { useViewOnlyAccess, HealthCheckContext } from './health-checks-utils';
import HealthChecks from './HealthChecks';

import './AddHealthChecks.scss';

type AddHealthChecksProps = {
  resource?: K8sResourceKind;
  currentContainer: string;
};

const AddHealthChecks: FC<FormikProps<FormikValues> & AddHealthChecksProps> = ({
  resource,
  currentContainer,
  handleSubmit,
  handleReset,
  errors,
  status,
  isSubmitting,
  setFieldValue,
  values,
  dirty,
}) => {
  const viewOnly = useViewOnlyAccess(resource);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentKey, setCurrentKey] = useState(currentContainer);
  const containers = resource?.spec?.template?.spec?.containers;
  const healthCheckAdded = _.every(
    containers,
    (container) => container.readinessProbe || container.livenessProbe || container.startupProbe,
  );
  const containersByKey = _.keyBy(containers, 'name');
  const pageTitle = healthCheckAdded
    ? t('devconsole~Edit health checks')
    : t('devconsole~Add health checks');
  const {
    kind,
    metadata: { name, namespace },
  } = resource;
  const kindForCRDResource = referenceFor(resource);
  const resourceKind = modelFor(kindForCRDResource).crd ? kindForCRDResource : kind;
  const isFormClean = _.every(values.healthChecks, { modified: false });

  const healthURL = getDocumentationURL(documentationURLs.applicationHealth);

  const handleSelectContainer = (containerName: string) => {
    const containerIndex = _.findIndex(resource.spec.template.spec.containers, [
      'name',
      containerName,
    ]);
    setCurrentKey(containerName);
    setFieldValue('containerName', containerName);
    setFieldValue('healthChecks', getHealthChecksData(resource, containerIndex));
    navigate(
      `/k8s/ns/${namespace}/${resourceKind}/${name}/containers/${containerName}/health-checks`,
      { replace: true },
    );
  };

  return (
    <HealthCheckContext.Provider value={{ viewOnly }}>
      <DocumentTitle>{pageTitle}</DocumentTitle>
      <PageHeading
        title={
          <>
            {pageTitle}
            {!isManaged() && (
              <ExternalLinkButton href={healthURL} variant="link">
                {t('devconsole~Learn more')}
              </ExternalLinkButton>
            )}
          </>
        }
      />
      <Form onSubmit={!viewOnly ? handleSubmit : undefined}>
        <div className="odc-add-health-checks__body">
          <p className="odc-add-health-checks__paragraph" data-test="health-checks-heading">
            <Trans t={t} ns="devconsole">
              Health checks for{' '}
              <ResourceLink
                kind={referenceFor(resource)}
                name={name}
                namespace={namespace}
                title={name}
                inline
              />
            </Trans>
          </p>
          <p className="odc-add-health-checks__paragraph">
            {t('devconsole~Container')} &nbsp;
            {_.size(containers) > 1 ? (
              <ContainerSelect
                currentKey={currentKey}
                containers={containersByKey}
                onChange={handleSelectContainer}
              />
            ) : (
              <ResourceLink
                kind={ContainerModel.kind}
                name={containers[0].name}
                linkTo={false}
                inline
              />
            )}
          </p>
          <br />
          <HealthChecks resourceType={getResourcesType(resource)} />
        </div>
        <FormFooter
          handleReset={handleReset}
          errorMessage={status && status?.errors?.json?.message}
          isSubmitting={isSubmitting}
          submitLabel={healthCheckAdded ? t('devconsole~Save') : t('devconsole~Add')}
          disableSubmit={isFormClean || !dirty || !_.isEmpty(errors) || isSubmitting}
          resetLabel={t('devconsole~Cancel')}
          hideSubmit={viewOnly}
        />
      </Form>
    </HealthCheckContext.Provider>
  );
};

export default AddHealthChecks;
