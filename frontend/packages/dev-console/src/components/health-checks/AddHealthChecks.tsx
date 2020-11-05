import * as React from 'react';
import * as _ from 'lodash';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { FormikProps, FormikValues } from 'formik';
import { Form, Button } from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import {
  ContainerDropdown,
  history,
  PageHeading,
  ResourceLink,
  ResourceIcon,
  openshiftHelpBase,
} from '@console/internal/components/utils';
import { ContainerModel } from '@console/internal/models';
import { K8sResourceKind, referenceFor, modelFor } from '@console/internal/module/k8s';
import { FormFooter } from '@console/shared';
import { getResourcesType } from '../edit-application/edit-application-utils';
import HealthChecks from './HealthChecks';
import { getHealthChecksData } from './create-health-checks-probe-utils';
import './AddHealthChecks.scss';
import { useViewOnlyAccess, HealthCheckContext } from './health-checks-utils';

type AddHealthChecksProps = {
  resource?: K8sResourceKind;
  currentContainer: string;
};

const AddHealthChecks: React.FC<FormikProps<FormikValues> & AddHealthChecksProps> = ({
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
  const [currentKey, setCurrentKey] = React.useState(currentContainer);
  const containers = resource?.spec?.template?.spec?.containers;
  const healthCheckAdded = _.every(
    containers,
    (container) => container.readinessProbe || container.livenessProbe || container.startupProbe,
  );
  const containersByKey = _.keyBy(containers, 'name');
  const pageTitle = healthCheckAdded
    ? t('devconsole~Edit Health Checks')
    : t('devconsole~Add Health Checks');
  const {
    kind,
    metadata: { name, namespace },
  } = resource;
  const kindForCRDResource = referenceFor(resource);
  const resourceKind = modelFor(kindForCRDResource).crd ? kindForCRDResource : kind;
  const isFormClean = _.every(values.healthChecks, { modified: false });

  const handleSelectContainer = (containerName: string) => {
    const containerIndex = _.findIndex(resource.spec.template.spec.containers, [
      'name',
      containerName,
    ]);
    setCurrentKey(containerName);
    setFieldValue('containerName', containerName);
    setFieldValue('healthChecks', getHealthChecksData(resource, containerIndex));
    history.replace(
      `/k8s/ns/${namespace}/${resourceKind}/${name}/containers/${containerName}/health-checks`,
    );
  };

  return (
    <HealthCheckContext.Provider value={{ viewOnly }}>
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>
      <PageHeading
        title={
          <>
            {pageTitle}
            <Button
              variant="link"
              component="a"
              href={`${openshiftHelpBase}applications/application-health.html`}
              target="_blank"
            >
              {t('devconsole~Learn More')} <ExternalLinkAltIcon />
            </Button>
          </>
        }
      />
      <div className="odc-add-health-checks__body">
        <p>
          {t('devconsole~Health checks for')} &nbsp;
          <ResourceLink
            kind={referenceFor(resource)}
            name={name}
            namespace={namespace}
            title={name}
            inline
          />
        </p>
        <Form onSubmit={!viewOnly ? handleSubmit : undefined}>
          <div>
            {t('devconsole~Container')} &nbsp;
            {_.size(containers) > 1 ? (
              <ContainerDropdown
                currentKey={currentKey}
                containers={containersByKey}
                onChange={handleSelectContainer}
              />
            ) : (
              <>
                <ResourceIcon kind={ContainerModel.kind} />
                {containers[0].name}
              </>
            )}
          </div>
          <HealthChecks resourceType={getResourcesType(resource)} />
          <FormFooter
            handleReset={handleReset}
            errorMessage={status && status?.errors?.json?.message}
            isSubmitting={isSubmitting}
            submitLabel={healthCheckAdded ? t('devconsole~Save') : t('devconsole~Add')}
            disableSubmit={isFormClean || !dirty || !_.isEmpty(errors)}
            resetLabel={t('devconsole~Cancel')}
            hideSubmit={viewOnly}
          />
        </Form>
      </div>
    </HealthCheckContext.Provider>
  );
};

export default AddHealthChecks;
