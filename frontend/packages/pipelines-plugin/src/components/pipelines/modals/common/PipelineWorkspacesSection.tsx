import * as React from 'react';
import * as _ from 'lodash';
import { useFormikContext, FormikValues, useField } from 'formik';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { SecretModel, ConfigMapModel } from '@console/internal/models';
import { DropdownField } from '@console/shared';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { Alert } from '@patternfly/react-core';
import { VolumeTypes } from '../../const';
import VolumeClaimTemplateForm from './VolumeClaimTemplateForm';
import PVCDropdown from './PVCDropdown';
import MultipleResourceKeySelector from './MultipleResourceKeySelector';
import { PipelineModalFormWorkspace } from './types';
import './PipelineWorkspacesSection.scss';

const getVolumeTypeFields = (volumeType: VolumeTypes, index: number) => {
  switch (volumeType) {
    case VolumeTypes.Secret: {
      return (
        <MultipleResourceKeySelector
          resourceNameField={`workspaces.${index}.data.secret.secretName`}
          resourceKeysField={`workspaces.${index}.data.secret.items`}
          label={i18next.t('pipelines-plugin~Secret')}
          resourceModel={SecretModel}
          addString={i18next.t('pipelines-plugin~Add item')}
          required
        />
      );
    }
    case VolumeTypes.ConfigMap: {
      return (
        <MultipleResourceKeySelector
          resourceNameField={`workspaces.${index}.data.configMap.name`}
          resourceKeysField={`workspaces.${index}.data.configMap.items`}
          label={i18next.t('pipelines-plugin~Config Map')}
          resourceModel={ConfigMapModel}
          addString={i18next.t('pipelines-plugin~Add item')}
          required
        />
      );
    }
    case VolumeTypes.EmptyDirectory: {
      return (
        <div className="odc-PipelineWorkspacesSection__emptydir">
          <Alert
            isInline
            variant="info"
            title={i18next.t(
              "pipelines-plugin~Empty Directory doesn't support shared data between tasks.",
            )}
          />
        </div>
      );
    }
    case VolumeTypes.VolumeClaimTemplate: {
      return (
        <VolumeClaimTemplateForm
          name={`workspaces.${index}.data.volumeClaimTemplate`}
          initialSizeValue="1"
          initialSizeUnit="Gi"
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
  const { t } = useTranslation();
  const { setFieldValue } = useFormikContext<FormikValues>();
  const [{ value: workspaces }] = useField<PipelineModalFormWorkspace[]>('workspaces');

  const volumeTypeOptions: { [type in VolumeTypes]: string } = {
    [VolumeTypes.NoWorkspace]: t('pipelines-plugin~No workspace'),
    [VolumeTypes.EmptyDirectory]: t('pipelines-plugin~Empty Directory'),
    [VolumeTypes.ConfigMap]: t('pipelines-plugin~Config Map'),
    [VolumeTypes.Secret]: t('pipelines-plugin~Secret'),
    [VolumeTypes.PVC]: t('pipelines-plugin~PersistentVolumeClaim'),
    [VolumeTypes.VolumeClaimTemplate]: t('pipelines-plugin~VolumeClaimTemplate'),
  };

  return (
    workspaces.length > 0 && (
      <FormSection title={t('pipelines-plugin~Workspaces')} fullWidth>
        {workspaces.map((workspace, index) => {
          return (
            <div className="form-group" key={workspace.name}>
              <DropdownField
                name={`workspaces.${index}.type`}
                label={workspace.name}
                items={
                  workspace.optional
                    ? volumeTypeOptions
                    : _.omit(volumeTypeOptions, VolumeTypes.NoWorkspace)
                }
                onChange={(type) =>
                  setFieldValue(
                    `workspaces.${index}.data`,
                    type === VolumeTypes.EmptyDirectory ? { emptyDir: {} } : {},
                    // Validation is automatically done by DropdownField useFormikValidationFix
                    false,
                  )
                }
                fullWidth
                required={!workspace.optional}
                helpText={workspace.description}
              />
              {getVolumeTypeFields(workspace.type, index)}
            </div>
          );
        })}
      </FormSection>
    )
  );
};

export default PipelineWorkspacesSection;
