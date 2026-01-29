import type { FC } from 'react';
import { useCallback } from 'react';
import { Formik } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import * as yup from 'yup';
import type { FirehoseResult } from '@console/internal/components/utils';
import { LoadingBox, StatusBox } from '@console/internal/components/utils';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { k8sUpdate, modelFor, referenceFor } from '@console/internal/module/k8s';
import { getResourcesType } from '../edit-application/edit-application-utils';
import AddHealthChecks from './AddHealthChecks';
import { getHealthChecksData } from './create-health-checks-probe-utils';
import { healthChecksProbesValidationSchema } from './health-checks-probe-validation-utils';
import { updateHealthChecksProbe } from './health-checks-utils';

type AddHealthChecksFormProps = {
  resource?: FirehoseResult<K8sResourceKind>;
  currentContainer: string;
};

const AddHealthChecksForm: FC<AddHealthChecksFormProps> = ({ resource, currentContainer }) => {
  const navigate = useNavigate();
  const handleCancel = useCallback(() => navigate(-1), [navigate]);
  const { t } = useTranslation();
  if (!resource.loaded && !resource.loadError) {
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
    return <div className="pf-v6-u-text-align-center">{t('devconsole~Container not found')}</div>;
  }

  const handleSubmit = (values, actions) => {
    const updatedResource = updateHealthChecksProbe(values, resource.data, container);

    return k8sUpdate(modelFor(referenceFor(resource.data)), updatedResource)
      .then(() => {
        actions.setStatus({ error: '' });
        navigate(-1);
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
      onReset={handleCancel}
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
