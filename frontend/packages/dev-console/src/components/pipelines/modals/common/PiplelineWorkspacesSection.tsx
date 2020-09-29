import * as React from 'react';
import { useFormikContext, FormikValues, useField } from 'formik';
import { SecretModel, ConfigMapModel } from '@console/internal/models';
import { DropdownField } from '@console/shared';
import FormSection from '../../../import/section/FormSection';
import { VolumeTypes } from '../../const';
import { PipelineRunWorkspaceFormEntry } from '../start-pipeline/types';
import PVCDropdown from './PVCDropdown';
import MultipleResourceKeySelector from './MultipleResourceKeySelector';

const getVolumeTypeFields = (volumeType: VolumeTypes, index: number) => {
  switch (VolumeTypes[volumeType]) {
    case VolumeTypes.Secret: {
      return (
        <MultipleResourceKeySelector
          resourceNameField={`workspaces.${index}.data.secret.secretName`}
          resourceKeysField={`workspaces.${index}.data.secret.items`}
          label="Secret"
          resourceModel={SecretModel}
          addString="Add item"
          required
        />
      );
    }
    case VolumeTypes.ConfigMap: {
      return (
        <MultipleResourceKeySelector
          resourceNameField={`workspaces.${index}.data.configMap.name`}
          resourceKeysField={`workspaces.${index}.data.configMap.items`}
          label="Config Map"
          resourceModel={ConfigMapModel}
          addString="Add item"
          required
        />
      );
    }
    case VolumeTypes.PVC: {
      return <PVCDropdown name={`workspaces.${index}.data.persistentVolumeClaim.claimName`} />;
    }
    default:
      return null;
  }
};

const PipelineWorkspacesSection: React.FC = () => {
  const { setFieldValue } = useFormikContext<FormikValues>();
  const [{ value: workspaces }] = useField<PipelineRunWorkspaceFormEntry[]>('workspaces');
  return (
    workspaces.length > 0 && (
      <FormSection title="Workspaces" fullWidth>
        {workspaces.map((workspace, index) => (
          <div className="form-group" key={workspace.name}>
            <DropdownField
              name={`workspaces.${index}.type`}
              label={workspace.name}
              items={VolumeTypes}
              onChange={(type) =>
                setFieldValue(
                  `workspaces.${index}.data`,
                  VolumeTypes[type] === VolumeTypes.EmptyDirectory ? { emptyDir: {} } : {},
                  // Validation is automatically done by DropdownField useFormikValidationFix
                  false,
                )
              }
              fullWidth
              required
            />
            {getVolumeTypeFields(workspace.type as VolumeTypes, index)}
          </div>
        ))}
      </FormSection>
    )
  );
};

export default PipelineWorkspacesSection;
