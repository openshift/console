import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { ListDropdown } from '@console/internal/components/utils';
import { toShallowJS } from '../../../../utils/immutable';
import { FormFieldRow } from '../../form/form-field-row';
import { FormField, FormFieldType } from '../../form/form-field';
import { VMSettingsField, VMWizardStorage } from '../../types';
import { DataVolumeWrapper } from '../../../../k8s/wrapper/vm/data-volume-wrapper';
import { ProjectDropdown } from '../../../form/project-dropdown';
import { iGetFieldValue } from '../../selectors/immutable/field';

export const ClonePVCSource: React.FC<ClonePVCSourceProps> = React.memo(
  ({ nsField, nameField, provisionSourceStorage, onChange, onProvisionSourceStorageChange }) => {
    const { t } = useTranslation();
    const storage: VMWizardStorage = toShallowJS(provisionSourceStorage);
    const pvcNamespace = iGetFieldValue(nsField, '');
    const pvcName = iGetFieldValue(nameField, '');

    return (
      <>
        <FormFieldRow field={nsField} fieldType={FormFieldType.DROPDOWN}>
          <FormField value={pvcNamespace || ''}>
            <ProjectDropdown
              onChange={(payload) => {
                onChange(VMSettingsField.CLONE_PVC_NS, payload);
                onChange(VMSettingsField.CLONE_PVC_NAME, undefined);
              }}
              project={pvcNamespace}
              placeholder={PersistentVolumeClaimModel.label}
            />
          </FormField>
        </FormFieldRow>
        <FormFieldRow field={nameField} fieldType={FormFieldType.DROPDOWN}>
          <ListDropdown
            resources={[
              {
                kind: PersistentVolumeClaimModel.kind,
                namespace: pvcNamespace,
              },
            ]}
            onChange={(val, kind, pvc: PersistentVolumeClaimKind) => {
              onChange(VMSettingsField.CLONE_PVC_NAME, pvc.metadata.name);
              onProvisionSourceStorageChange({
                ...storage,
                dataVolume: new DataVolumeWrapper(storage?.dataVolume, true)
                  .appendTypeData({ name: pvc.metadata.name, namespace: pvcNamespace }, false)
                  .setSize(pvc.spec.resources.requests.storage, '')
                  .asResource(),
              });
            }}
            selectedKey={pvcName}
            selectedKeyKind={PersistentVolumeClaimModel.kind}
            placeholder={t('kubevirt-plugin~--- Select Persistent Volume Claim ---')}
            desc={PersistentVolumeClaimModel.label}
          />
        </FormFieldRow>
      </>
    );
  },
);

type ClonePVCSourceProps = {
  nsField: any;
  nameField: any;
  provisionSourceStorage: any;
  onProvisionSourceStorageChange: (provisionSourceStorage: any) => void;
  onChange: (key: string, value: string | boolean) => void;
};
