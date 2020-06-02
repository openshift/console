import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { Button } from '@patternfly/react-core';
import { ExpandCollapse } from '@console/internal/components/utils';
import { SecretModel } from '@console/internal/models';
import { SecretKind } from '@console/internal/module/k8s';
import { getSecretAnnotations } from '../../../../utils/pipeline-utils';
import SecretForm from './SecretForm';
import SecretsList from './SecretsList';
import { secretFormDefaultValues, isDuplicate } from './utils';
import { useFetchSecrets } from './hooks';

import './PipelineSecretSection.scss';

type PipelineSecretSectionProps = {
  namespace: string;
};

const PipelineSecretSection: React.FC<PipelineSecretSectionProps> = ({ namespace }) => {
  const {
    setFieldValue,
    values: { newSecrets, secretOpen, secretForm },
    setFieldTouched,
    setFieldError,
  } = useFormikContext<FormikValues>();
  const existingSecrets: SecretKind[] = useFetchSecrets(namespace);

  const resetSecretForm = () => {
    setFieldTouched(`secretForm`, false);
    setFieldValue(`secretForm`, secretFormDefaultValues);
    setFieldValue(`secretOpen`, false);
  };

  const handleSubmit = () => {
    if (isDuplicate(existingSecrets, secretForm.secretName)) {
      setFieldError(`secretForm.secretName`, 'Secret name already exists.');
    } else if (isDuplicate(newSecrets, secretForm.secretName)) {
      setFieldError(`secretForm.secretName`, 'Secret name already added.');
    } else {
      const newSecret: SecretKind = {
        apiVersion: SecretModel.apiVersion,
        kind: SecretModel.kind,
        metadata: {
          name: secretForm.secretName,
          namespace,
          annotations: getSecretAnnotations(secretForm.annotations),
        },
        type: secretForm.type,
        stringData: secretForm.formData,
      };
      setFieldValue(`newSecrets`, [...newSecrets, newSecret]);
      resetSecretForm();
    }
  };

  return (
    <ExpandCollapse textExpanded="Hide Credential Options" textCollapsed="Show Credential Options">
      <div className="odc-pipeline-secret-section">
        <p>
          The following secrets are available for all pipelines in this namespace to authenticate to
          the specified git server or docker registry:
        </p>
        <div className="odc-pipeline-secret-section__secrets">
          <SecretsList namespace={namespace} secrets={existingSecrets} />
          {secretOpen ? (
            <div className="odc-pipeline-secret-section__secret-form">
              <SecretForm onSubmit={handleSubmit} onClose={resetSecretForm} />
            </div>
          ) : (
            <Button
              variant="link"
              onClick={() => {
                setFieldValue(`secretOpen`, true);
              }}
              className="odc-pipeline-secret-section__secret-action"
              icon={<PlusCircleIcon />}
            >
              Add Secret
            </Button>
          )}
        </div>
      </div>
    </ExpandCollapse>
  );
};

export default PipelineSecretSection;
