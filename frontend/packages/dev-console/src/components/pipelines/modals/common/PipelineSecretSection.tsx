import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Formik, useField, useFormikContext, FormikValues } from 'formik';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { Button } from '@patternfly/react-core';
import { ExpandCollapse } from '@console/internal/components/utils';
import { SecretType } from '@console/internal/components/secrets/create-secret';
import { SecretModel } from '@console/internal/models';
import { k8sCreate } from '@console/internal/module/k8s';
import {
  associateServiceAccountToSecret,
  getSecretAnnotations,
} from '../../../../utils/pipeline-utils';
import { SecretAnnotationId } from '../../const';
import { advancedSectionValidationSchema } from './validation-utils';
import SecretForm from './SecretForm';
import SecretsList from './SecretsList';

import './PipelineSecretSection.scss';

const initialValues = {
  secretName: '',
  annotations: { key: SecretAnnotationId.Image, value: '' },
  type: SecretType.dockerconfigjson,
  formData: {},
};

type PipelineSecretSectionProps = {
  namespace: string;
};

const PipelineSecretSection: React.FC<PipelineSecretSectionProps> = ({ namespace }) => {
  const { t } = useTranslation();
  const [secretOpenField] = useField<boolean>('secretOpen');
  const { setFieldValue } = useFormikContext<FormikValues>();

  const handleSubmit = (values, actions) => {
    actions.setSubmitting(true);
    const newSecret = {
      apiVersion: SecretModel.apiVersion,
      kind: SecretModel.kind,
      metadata: {
        name: values.secretName,
        namespace,
        annotations: getSecretAnnotations(values.annotations),
      },
      type: values.type,
      stringData: values.formData,
    };
    k8sCreate(SecretModel, newSecret)
      .then((resp) => {
        actions.setSubmitting(false);
        setFieldValue(secretOpenField.name, false);
        associateServiceAccountToSecret(resp, namespace);
      })
      .catch((err) => {
        actions.setSubmitting(false);
        actions.setStatus({ submitError: err.message });
      });
  };

  const handleReset = (values, actions) => {
    actions.resetForm({ values: initialValues, status: {} });
    setFieldValue(secretOpenField.name, false);
  };

  return (
    <ExpandCollapse
      textExpanded={t('devconsole~Hide Credential Options')}
      textCollapsed={t('devconsole~Show Credential Options')}
    >
      <div className="odc-pipeline-secret-section">
        <p>
          {t(
            'devconsole~The following secrets are available for all pipelines in this namespace to authenticate to the specified Git server or Docker registry:',
          )}
        </p>
        <div className="odc-pipeline-secret-section__secrets">
          <SecretsList namespace={namespace} />
          {secretOpenField.value ? (
            <div className="odc-pipeline-secret-section__secret-form">
              <Formik
                initialValues={initialValues}
                validationSchema={advancedSectionValidationSchema(t)}
                onSubmit={handleSubmit}
                onReset={handleReset}
              >
                {(formikProps) => <SecretForm {...formikProps} />}
              </Formik>
            </div>
          ) : (
            <Button
              variant="link"
              onClick={() => {
                setFieldValue(secretOpenField.name, true);
              }}
              className="odc-pipeline-secret-section__secret-action"
              icon={<PlusCircleIcon />}
            >
              {t('devconsole~Add Secret')}
            </Button>
          )}
        </div>
      </div>
    </ExpandCollapse>
  );
};

export default PipelineSecretSection;
