import * as React from 'react';
import { Formik } from 'formik';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { Button } from '@patternfly/react-core';
import { ExpandCollapse } from '@console/internal/components/utils';
import { SecretType } from '@console/internal/components/secrets/create-secret';
import { SecretModel } from '@console/internal/models';
import { k8sCreate } from '@console/internal/module/k8s';
import SecretForm from './SecretForm';
import { associateServiceAccountToSecret } from '../../../utils/pipeline-utils';
import SecretsList from './SecretsList';
import './PipelineSecretSection.scss';

const initialValues = {
  secretName: '',
  type: SecretType.dockerconfigjson,
  formData: {},
};

type PipelineSecretSectionProps = {
  namespace: string;
};

const PipelineSecretSection: React.FC<PipelineSecretSectionProps> = ({ namespace }) => {
  const [addSecret, setAddSecret] = React.useState(false);

  const handleSubmit = (values, actions) => {
    actions.setSubmitting(true);
    const newSecret = {
      apiVersion: SecretModel.apiVersion,
      kind: SecretModel.kind,
      metadata: {
        name: values.secretName,
        namespace,
      },
      type: values.type,
      stringData: values.formData,
    };

    k8sCreate(SecretModel, newSecret)
      .then((resp) => {
        actions.setSubmitting(false);
        setAddSecret(false);
        associateServiceAccountToSecret(resp, namespace);
      })
      .catch((err) => {
        actions.setSubmitting(false);
        actions.setStatus({ submitError: err.message });
      });
  };

  const handleReset = (values, actions) => {
    actions.resetForm({ values: initialValues, status: {} });
    setAddSecret(false);
  };

  const handleAddSecret = () => {
    setAddSecret(true);
  };
  return (
    <ExpandCollapse textExpanded="Hide Credential Options" textCollapsed="Show Credential Options">
      <div className="odc-pipeline-secret-section">
        <p>The following secrets are available for all pipelines in this namespace:</p>
        <div className="odc-pipeline-secret-section__secrets">
          <SecretsList namespace={namespace} />
          {addSecret ? (
            <div className="odc-pipeline-secret-section__secret-form">
              <Formik initialValues={initialValues} onSubmit={handleSubmit} onReset={handleReset}>
                {(props) => <SecretForm {...props} />}
              </Formik>
            </div>
          ) : (
            <Button variant="link" onClick={handleAddSecret} icon={<PlusCircleIcon />}>
              Add Secret
            </Button>
          )}
        </div>
      </div>
    </ExpandCollapse>
  );
};

export default PipelineSecretSection;
