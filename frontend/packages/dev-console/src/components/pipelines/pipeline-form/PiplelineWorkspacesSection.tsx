import * as React from 'react';
import { FieldArray, useFormikContext, FormikValues } from 'formik';
import FormSection from '../../import/section/FormSection';
import { DropdownField } from '@console/shared';
import PVCDropdown from './PVCDropdown';
import MultipleResourceKeySelector from './MultipleResourceKeySelector';
import { SecretModel, ConfigMapModel } from '@console/internal/models';

export enum VolumeTypes {
  'Empty Directory' = 'Empty Directory',
  'Config Map' = 'Config Map',
  Secret = 'Secret',
  PVC = 'PVC',
}

const getVolumeTypeFields = (volumeType: string, index: number) => {
  switch (volumeType) {
    case VolumeTypes.Secret: {
      return (
        <MultipleResourceKeySelector
          resourceNameField={`workspaces.${index}.data.secret.secretName`}
          resourceKeysField={`workspaces.${index}.data.secret.items`}
          label="Secret"
          resourceModel={SecretModel}
          fullWidth
          required
        />
      );
    }
    case VolumeTypes['Config Map']: {
      return (
        <MultipleResourceKeySelector
          resourceNameField={`workspaces.${index}.data.configMap.name`}
          resourceKeysField={`workspaces.${index}.data.configMap.items`}
          label="Config Map"
          resourceModel={ConfigMapModel}
          fullWidth
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
  const {
    values: { workspaces },
  } = useFormikContext<FormikValues>();
  return (
    <FieldArray
      name="parameters"
      key="parameters-row"
      render={() =>
        workspaces.length > 0 && (
          <FormSection title="Workspaces" fullWidth>
            {workspaces.map((workspace, index) => (
              <div className="form-group" key={`${workspace.name}`}>
                <DropdownField
                  name={`workspaces.${index}.type`}
                  label={`${workspace.name}`}
                  items={VolumeTypes}
                  fullWidth
                  required
                />
                {getVolumeTypeFields(workspaces[index].type, index)}
              </div>
            ))}
          </FormSection>
        )
      }
    />
  );
};

export default PipelineWorkspacesSection;
