import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PersistentVolumeClaimKind, StorageClassResourceKind } from '@console/internal/module/k8s';
import {
  FileUpload,
  Form,
  SelectOption,
  TextInput,
  Checkbox,
  ExpandableSection,
  FormSelect,
  FormSelectOption,
  Popover,
  PopoverPosition,
} from '@patternfly/react-core';
import { HelpIcon } from '@patternfly/react-icons';
import { PersistentVolumeClaimModel, StorageClassModel } from '@console/internal/models';
import { ListDropdown, LoadingInline, RequestSizeInput } from '@console/internal/components/utils';
import {
  dropdownUnits,
  getAccessModeForProvisioner,
  provisionerAccessModeMapping,
} from '@console/internal/components/storage/shared';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';

import { FormRow } from '../../form/form-row';
import { ProjectDropdown } from '../../form/project-dropdown';
import { getDefaultStorageClass } from '../../../selectors/config-map/sc-defaults';
import { BootSourceAction, BootSourceState, BOOT_ACTION_TYPE } from './boot-source-form-reducer';
import { AccessMode } from '../../../constants';
import { FormPFSelect } from '../../form/form-pf-select';
import { preventDefault } from '../../form/utils';
import { ProvisionSource } from '../../../constants/vm/provision-source';
import { URLSourceHelp } from '../../form/helper/url-source-help';
import { ContainerSourceHelp } from '../../form/helper/container-source-help';

type BootSourceFormProps = {
  state: BootSourceState;
  dispatch: React.Dispatch<BootSourceAction>;
  withUpload?: boolean;
  disabled?: boolean;
};

export const BootSourceForm: React.FC<BootSourceFormProps> = ({
  state,
  dispatch,
  withUpload,
  disabled,
}) => {
  const { t } = useTranslation();
  const [storageClasses, scLoaded] = useK8sWatchResource<StorageClassResourceKind[]>({
    kind: StorageClassModel.kind,
    isList: true,
    namespaced: false,
  });

  const defaultSCName = getDefaultStorageClass(storageClasses)?.metadata.name;

  const handleStorageClass = React.useCallback(
    (scName: string) => {
      const updatedStorageClass = storageClasses.find((sc) => sc.metadata.name === scName);
      const provisioner = updatedStorageClass?.provisioner || '';
      const modes: string[] =
        provisionerAccessModeMapping[provisioner] || getAccessModeForProvisioner(provisioner);
      dispatch({
        type: BOOT_ACTION_TYPE.SET_ACCESS_MODE,
        payload: AccessMode.READ_WRITE_ONCE.getValue(),
      });
      dispatch({
        type: BOOT_ACTION_TYPE.SET_ACCESS_MODES,
        payload: modes,
      });
      dispatch({
        type: BOOT_ACTION_TYPE.SET_STORAGE_CLASS,
        payload: updatedStorageClass?.metadata?.name,
      });
    },
    [dispatch, storageClasses],
  );

  React.useEffect(() => {
    if (scLoaded && !state.storageClass?.value && defaultSCName) {
      handleStorageClass(defaultSCName);
    }
  }, [defaultSCName, handleStorageClass, scLoaded, state.storageClass]);

  return (
    <Form onSubmit={preventDefault}>
      <FormRow fieldId="form-data-source" title={t('kubevirt-plugin~Boot source type')} isRequired>
        <FormPFSelect
          placeholderText={t('kubevirt-plugin~--- Select boot source ---')}
          aria-label={t('kubevirt-plugin~Select boot source')}
          onSelect={(e, value: ProvisionSource) =>
            dispatch({
              type: BOOT_ACTION_TYPE.SET_DATA_SOURCE,
              payload: value.getValue(),
            })
          }
          selections={ProvisionSource.fromString(state.dataSource?.value)}
          isDisabled={disabled}
        >
          {(withUpload
            ? ProvisionSource.getVMTemplateBaseImageSources()
            : ProvisionSource.getBasicWizardSources()
          )
            .sort((a, b) => a.getOrder() - b.getOrder())
            .map((ds) => (
              <SelectOption key={ds.getValue()} value={ds} description={t(ds.getDescriptionKey())}>
                {t(ds.toString())}
              </SelectOption>
            ))}
        </FormPFSelect>
      </FormRow>
      {state.dataSource?.value === ProvisionSource.UPLOAD.getValue() && (
        <FormRow fieldId="form-ds-file" title={t('kubevirt-plugin~Upload source')} isRequired>
          <FileUpload
            id="file-upload"
            value={state.file?.value.value}
            filename={state.file?.value.name}
            onChange={(file: File, name: string) =>
              dispatch({
                type: BOOT_ACTION_TYPE.SET_FILE,
                payload: { value: file, name },
              })
            }
            hideDefaultPreview
            isRequired
            isDisabled={disabled}
          />
        </FormRow>
      )}
      {state.dataSource?.value === ProvisionSource.URL.getValue() && (
        <FormRow
          fieldId="form-ds-url"
          title={t('kubevirt-plugin~Import URL')}
          isRequired
          validation={state.url?.validation}
        >
          <TextInput
            value={state.url?.value}
            type="text"
            onChange={(payload) => dispatch({ type: BOOT_ACTION_TYPE.SET_URL, payload })}
            aria-label={t('kubevirt-plugin~Import URL')}
            isDisabled={disabled}
          />
          <URLSourceHelp />
        </FormRow>
      )}
      {state.dataSource?.value === ProvisionSource.CONTAINER.getValue() && (
        <FormRow
          fieldId="form-ds-container"
          title={t('kubevirt-plugin~Container image')}
          isRequired
          validation={state.container?.validation}
        >
          <TextInput
            value={state.container?.value}
            type="text"
            onChange={(payload) => dispatch({ type: BOOT_ACTION_TYPE.SET_CONTAINER, payload })}
            aria-label={t('kubevirt-plugin~Container image')}
            isDisabled={disabled}
          />
          <ContainerSourceHelp />
        </FormRow>
      )}
      {state.dataSource?.value === ProvisionSource.DISK.getValue() && (
        <>
          <FormRow
            fieldId="form-ds-pvc-ns"
            title={t('kubevirt-plugin~Persistent Volume Claim project')}
            isRequired
          >
            <ProjectDropdown
              onChange={(payload) => {
                dispatch({ type: BOOT_ACTION_TYPE.SET_PVC_NAMESPACE, payload });
                dispatch({ type: BOOT_ACTION_TYPE.SET_PVC_NAME, payload: undefined });
              }}
              project={state.pvcNamespace?.value}
              placeholder={PersistentVolumeClaimModel.label}
              disabled={disabled}
            />
          </FormRow>
          {state.pvcNamespace?.value && (
            <FormRow
              fieldId="form-ds-pvc"
              title={t('kubevirt-plugin~Persistent Volume Claim name')}
              isRequired
            >
              <ListDropdown
                resources={[
                  {
                    kind: PersistentVolumeClaimModel.kind,
                    namespace: state.pvcNamespace.value,
                  },
                ]}
                onChange={(val, kind, pvc: PersistentVolumeClaimKind) => {
                  dispatch({ type: BOOT_ACTION_TYPE.SET_PVC_NAME, payload: pvc.metadata.name });
                  dispatch({
                    type: BOOT_ACTION_TYPE.SET_PVC_SIZE,
                    payload: pvc.spec.resources.requests.storage,
                  });
                }}
                placeholder={t('kubevirt-plugin~--- Select Persistent Volume Claim ---')}
                desc={PersistentVolumeClaimModel.label}
                disabled={disabled}
              />
            </FormRow>
          )}
        </>
      )}
      <FormRow fieldId="form-ds-cdrom">
        <Checkbox
          isChecked={state.cdRom?.value}
          onChange={(payload) => dispatch({ type: BOOT_ACTION_TYPE.SET_CD_ROM, payload })}
          isDisabled={disabled}
          label={
            <>
              {t('kubevirt-plugin~Mount this source as CD-ROM')}
              <Popover
                position={PopoverPosition.top}
                aria-label={t('kubevirt-plugin~CDROM help')}
                bodyContent={t(
                  'kubevirt-plugin~CD-ROM requires an additional disk for the operating system to be installed onto. This disk will be added and can be customized when creating the virtual machine.',
                )}
              >
                <button
                  type="button"
                  onClick={preventDefault}
                  className="pf-c-form__group-label-help"
                  aria-label={t('kubevirt-plugin~CDROM help')}
                >
                  <HelpIcon noVerticalAlign />
                </button>
              </Popover>
            </>
          }
          id="cdrom"
        />
      </FormRow>
      {[ProvisionSource.UPLOAD, ProvisionSource.URL, ProvisionSource.CONTAINER].includes(
        ProvisionSource.fromString(state.dataSource?.value),
      ) && (
        <FormRow
          fieldId="form-ds-pvc-size"
          title={t('kubevirt-plugin~Persistent Volume Claim size')}
          isRequired
          validation={state.size?.validation}
        >
          <RequestSizeInput
            isInputDisabled={disabled}
            name="requestSize"
            required
            onChange={(payload) => dispatch({ type: BOOT_ACTION_TYPE.SET_SIZE, payload })}
            defaultRequestSizeUnit={state.size?.value.unit}
            defaultRequestSizeValue={`${state.size?.value.value}`}
            dropdownUnits={dropdownUnits}
            describedBy="request-size-help"
            inputID="request-size-input"
          >
            <div className="pf-c-form__helper-text" aria-live="polite">
              {t(
                'kubevirt-plugin~Ensure your PVC size covers the requirements of the uncompressed image and any other space requirements. More storage can be added later.',
              )}
            </div>
          </RequestSizeInput>
        </FormRow>
      )}
      {withUpload && (
        <FormRow fieldId="form-ds-provider" title={t('kubevirt-plugin~Source provider')}>
          <TextInput
            isDisabled={disabled}
            value={state.provider?.value}
            type="text"
            onChange={(payload) => dispatch({ type: BOOT_ACTION_TYPE.SET_PROVIDER, payload })}
            aria-label={t('kubevirt-plugin~Source provider')}
          />
          <div className="pf-c-form__helper-text" aria-live="polite">
            {t('kubevirt-plugin~Example: your company name')}
          </div>
        </FormRow>
      )}
      <ExpandableSection toggleText={t('kubevirt-plugin~Advanced')}>
        <FormRow fieldId="form-ds-sc" title={t('kubevirt-plugin~Storage class')} isRequired>
          <FormSelect
            value={
              defaultSCName === state.storageClass?.value
                ? t('kubevirt-plugin~{{name}} (default)', { name: state.storageClass?.value })
                : state.storageClass?.value
            }
            onChange={handleStorageClass}
            id="vm-select-sc"
            name="vm-select-sc"
            aria-label={t('kubevirt-plugin~Select Storage Class')}
            isDisabled={!scLoaded || disabled}
          >
            {storageClasses.map((sc) => (
              <FormSelectOption
                key={sc.metadata.uid}
                value={sc.metadata.name}
                label={
                  defaultSCName === sc.metadata.name
                    ? t('kubevirt-plugin~{{name}} (default)', { name: sc.metadata.name })
                    : sc.metadata.name
                }
              />
            ))}
          </FormSelect>
          {!scLoaded && <LoadingInline />}
        </FormRow>
        <FormRow fieldId="form-ds-access-mode" title={t('kubevirt-plugin~Access mode')} isRequired>
          <FormPFSelect
            isDisabled={disabled}
            aria-label={t('kubevirt-plugin~Select access mode')}
            onSelect={(e, value: AccessMode) =>
              dispatch({
                type: BOOT_ACTION_TYPE.SET_ACCESS_MODE,
                payload: value.getValue(),
              })
            }
            selections={AccessMode.fromString(state.accessMode?.value)}
          >
            {state.accessModes?.value?.map((am) => {
              const accessMode = AccessMode.fromString(am);
              return <SelectOption key={accessMode.getValue()} value={accessMode} />;
            })}
          </FormPFSelect>
          {!scLoaded && <LoadingInline />}
        </FormRow>
      </ExpandableSection>
    </Form>
  );
};
