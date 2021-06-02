import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ListDropdown } from '@console/internal/components/utils';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { DataVolumeWrapper } from '../../../../k8s/wrapper/vm/data-volume-wrapper';
import { toShallowJS } from '../../../../utils/immutable';
import { ProjectDropdown } from '../../../form/project-dropdown';
import { FormField, FormFieldType } from '../../form/form-field';
import { FormFieldRow } from '../../form/form-field-row';
import { VMWizardStorage } from '../../types';

export const ClonePVCSource: React.FC<ClonePVCSourceProps> = React.memo(
  ({ nsField, nameField, provisionSourceStorage, onProvisionSourceStorageChange }) => {
    const { t } = useTranslation();
    const storage: VMWizardStorage = toShallowJS(provisionSourceStorage);
    const dataVolumeWrapper = new DataVolumeWrapper(storage?.dataVolume);
    const pvcName = dataVolumeWrapper.getPersistentVolumeClaimName();
    const pvcNamespace = dataVolumeWrapper.getPersistentVolumeClaimNamespace();

    return (
      <>
        <FormFieldRow field={nsField} fieldType={FormFieldType.DROPDOWN}>
          <FormField value={pvcNamespace || ''}>
            <ProjectDropdown
              onChange={(payload) => {
                onProvisionSourceStorageChange({
                  ...storage,
                  dataVolume: new DataVolumeWrapper(storage?.dataVolume, true)
                    .appendTypeData({ namespace: payload }, false)
                    .setSize('15Gi', '')
                    .asResource(),
                });
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
};
