import * as React from 'react';
import * as _ from 'lodash';
import * as yup from 'yup';
import { Formik } from 'formik';
import { FirehoseResult, LoadingBox, StatusBox, history } from '@console/internal/components/utils';
import { K8sResourceKind, k8sUpdate, modelFor, referenceFor } from '@console/internal/module/k8s';
import { getResourcesType } from '../edit-application/edit-application-utils';
import { healthChecksProbesValidationSchema } from './health-checks-probe-validation-utils';
import { getHealthChecksData } from './create-health-checks-probe-utils';
import AddHealthChecks from './AddHealthChecks';
import { updateHealthChecksProbe } from './health-checks-utils';

type AddHealthChecksFormProps = {
  resource?: FirehoseResult<K8sResourceKind>;
  currentContainer: string;
};

const AddHealthChecksForm: React.FC<AddHealthChecksFormProps> = ({
  resource,
  currentContainer,
}) => {
  if (!resource.loaded && _.isEmpty(resource.loadError)) {
    return <LoadingBox />;
  }

  if (resource.loadError) {
    return <StatusBox loaded={resource.loaded} loadError={resource.loadError} />;
  }

  const container = _.find(
    resource.data.spec.template.spec.containers,
    (data) => data.name === currentContainer,
  );

  if (_.isEmpty(container)) {
    return <div className="text-center">Container not found</div>;
  }

  const handleSubmit = (values, actions) => {
    const updatedResource = updateHealthChecksProbe(values, resource.data, container);

    k8sUpdate(modelFor(referenceFor(resource.data)), updatedResource)
      .then(() => {
        actions.setSubmitting(false);
        actions.setStatus({ error: '' });
        history.goBack();
      })
      .catch((err) => {
        actions.setSubmitting(false);
        actions.setStatus({ errors: err });
      });
  };
  const containerIndex = _.findIndex(resource.data.spec.template.spec.containers, [
    'name',
    currentContainer,
  ]);
  const initialValues = {
    healthChecks: getHealthChecksData(resource.data, containerIndex),
    containerName: container.name,
    resources: getResourcesType(resource.data),
    image: {
      ports: container.ports || [],
    },
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={yup.object().shape({
        healthChecks: healthChecksProbesValidationSchema,
      })}
      onSubmit={handleSubmit}
      onReset={history.goBack}
    >
      {(props) => (
        <AddHealthChecks resource={resource.data} currentContainer={currentContainer} {...props} />
      )}
    </Formik>
  );
};

export default AddHealthChecksForm;
