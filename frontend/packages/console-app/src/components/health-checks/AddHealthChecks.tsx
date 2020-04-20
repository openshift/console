import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import { Form, Button } from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import {
  ContainerDropdown,
  history,
  PageHeading,
  ResourceLink,
  ResourceIcon,
} from '@console/internal/components/utils';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { FormFooter } from '@console/shared';
import { getResourcesType } from '@console/dev-console/src/components/edit-application/edit-application-utils';
import HealthChecks from './HealthChecks';
import Helmet from 'react-helmet';
import { ContainerModel } from '@console/internal/models';
import { getHealthChecksData } from './create-health-checks-probe-utils';
import { healthCheckAdded } from '../../actions/modify-health-checks';
import './AddHealthChecks.scss';

type AddHealthChecksProps = {
  resource?: K8sResourceKind;
  currentContainer: string;
};

const AddHealthChecks: React.FC<FormikProps<FormikValues> & AddHealthChecksProps> = ({
  resource,
  currentContainer,
  handleSubmit,
  handleReset,
  dirty,
  errors,
  status,
  isSubmitting,
  setFieldValue,
}) => {
  const [currentKey, setCurrentKey] = React.useState(currentContainer);
  const containers = resource?.spec?.template?.spec?.containers;
  const containersByKey = _.keyBy(containers, 'name');
  const pageTitle = healthCheckAdded(containers) ? 'Edit Health Checks' : 'Add Health Checks';

  const handleSelectContainer = (containerName: string) => {
    const containerIndex = _.findIndex(resource.spec.template.spec.containers, [
      'name',
      containerName,
    ]);
    setCurrentKey(containerName);
    setFieldValue('containerName', containerName);
    setFieldValue('healthChecks', getHealthChecksData(resource, containerIndex));
    history.replace(
      `/k8s/ns/${resource.metadata.namespace}/${resource.kind}/${resource.metadata.name}/containers/${containerName}/health-checks`,
    );
  };

  return (
    <>
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
              href="https://docs.openshift.com/container-platform/3.11/dev_guide/application_health.html"
              target="_blank"
            >
              Learn More <ExternalLinkAltIcon />
            </Button>
          </>
        }
      />
      <div className="odc-add-health-checks__body">
        <p>
          Health checks for &nbsp;
          <ResourceLink
            kind={referenceFor(resource)}
            name={resource.metadata.name}
            namespace={resource.metadata.namespace}
            title={resource.metadata.name}
            inline
          />
        </p>
        <Form onSubmit={handleSubmit}>
          <div>
            Container &nbsp;
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
            submitLabel={healthCheckAdded(containers) ? 'Edit' : 'Add'}
            disableSubmit={!dirty || !_.isEmpty(errors)}
            resetLabel="Cancel"
          />
        </Form>
      </div>
    </>
  );
};

export default AddHealthChecks;
