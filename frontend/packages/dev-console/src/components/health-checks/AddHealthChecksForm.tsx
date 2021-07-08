import * as React from 'react';
import { Formik } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import { FirehoseResult, LoadingBox, StatusBox, history } from '@console/internal/components/utils';
import { K8sResourceKind, k8sUpdate, modelFor, referenceFor } from '@console/internal/module/k8s';
import { getResourcesType } from '../edit-application/edit-application-utils';
import AddHealthChecks from './AddHealthChecks';
import { getHealthChecksData } from './create-health-checks-probe-utils';
import { healthChecksProbesValidationSchema } from './health-checks-probe-validation-utils';
import { updateHealthChecksProbe } from './health-checks-utils';

type AddHealthChecksFormProps = {
  resource?: FirehoseResult<K8sResourceKind>;
  currentContainer: string;
};

const AddHealthChecksForm: React.FC<AddHealthChecksFormProps> = ({
  resource,
  currentContainer,
}) => {
  const { t } = useTranslation();
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
    return <div className="text-center">{t('devconsole~Container not found')}</div>;
  }

  const handleSubmit = (values, actions) => {
    const updatedResource = updateHealthChecksProbe(values, resource.data, container);

    return k8sUpdate(modelFor(referenceFor(resource.data)), updatedResource)
      .then(() => {
        actions.setStatus({ error: '' });
        history.goBack();
      })
      .catch((err) => {
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
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={yup.object().shape({
        healthChecks: healthChecksProbesValidationSchema(t),
      })}
      onSubmit={handleSubmit}
      onReset={history.goBack}
    >
      {(formikProps) => (
        <AddHealthChecks
          resource={resource.data}
          currentContainer={currentContainer}
          {...formikProps}
        />
      )}
    </Formik>
  );
};

export default AddHealthChecksForm;
