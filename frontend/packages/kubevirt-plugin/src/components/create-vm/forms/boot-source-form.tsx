import * as React from 'react';
import {
  Checkbox,
  ExpandableSection,
  FileUpload,
  Form,
  SelectOption,
  TextInput,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { AccessModeSelector } from '@console/app/src/components/access-modes/access-mode';
import { VolumeModeSelector } from '@console/app/src/components/volume-modes/volume-mode';
import { dropdownUnits, initialAccessModes } from '@console/internal/components/storage/shared';
import {
  FieldLevelHelp,
  ListDropdown,
  LoadingInline,
  RequestSizeInput,
} from '@console/internal/components/utils';
import { StorageClassDropdown } from '@console/internal/components/utils/storage-class-dropdown';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { PersistentVolumeClaimKind, StorageClassResourceKind } from '@console/internal/module/k8s';
import { AccessMode, ANNOTATION_SOURCE_PROVIDER, VolumeMode } from '../../../constants';
import { ProvisionSource } from '../../../constants/vm/provision-source';
import { useStorageProfileSettings } from '../../../hooks/use-storage-profile-settings';
import { getDefaultStorageClass } from '../../../selectors/config-map/sc-defaults';
import { getAnnotation } from '../../../selectors/selectors';
import { getGiBUploadPVCSizeByImage } from '../../cdi-upload-provider/upload-pvc-form/upload-pvc-form';
import { VMSettingsField } from '../../create-vm-wizard/types';
import { getFieldId } from '../../create-vm-wizard/utils/renderable-field-utils';
import { FormPFSelect } from '../../form/form-pf-select';
import { FormRow } from '../../form/form-row';
import { ContainerSourceHelp } from '../../form/helper/container-source-help';
import { URLSourceHelp } from '../../form/helper/url-source-help';
import { ProjectDropdown } from '../../form/project-dropdown';
import { preventDefault } from '../../form/utils';
import { BOOT_ACTION_TYPE, BootSourceAction, BootSourceState } from './boot-source-form-reducer';

type AdvancedSectionProps = {
  state: BootSourceState;
  dispatch: React.Dispatch<BootSourceAction>;
  disabled?: boolean;
  storageClasses: StorageClassResourceKind[];
  storageClassesLoaded: boolean;
  scAllowed?: boolean;
  scAllowedLoading: boolean;
};

const AdvancedSection: React.FC<AdvancedSectionProps> = ({
  state,
  dispatch,
  storageClasses,
  storageClassesLoaded,
  scAllowedLoading,
}) => {
  const { t } = useTranslation();

  const updatedStorageClass = storageClasses?.find(
    (sc) => sc.metadata.name === state.storageClass?.value,
  );
  const storageClassName = updatedStorageClass?.metadata?.name;

  const defaultSCName = getDefaultStorageClass(storageClasses)?.metadata.name;

  const [spAccessMode, spVolumeMode, spLoaded, isSPSettingProvided] = useStorageProfileSettings(
    storageClassName || defaultSCName,
  );

  const [applySP, setApplySP] = React.useState<boolean>(true);

  const provisioner = updatedStorageClass?.provisioner || '';

  const handleStorageClass = React.useCallback(
    (scName: string) => {
      dispatch({
        type: BOOT_ACTION_TYPE.SET_STORAGE_CLASS,
        payload: scName,
      });
    },
    [dispatch],
  );

  const handleAccessAndVolumeModeChange = React.useCallback(
    (accessMode = AccessMode.READ_WRITE_ONCE, volumeMode = VolumeMode.FILESYSTEM) => {
      dispatch({
        type: BOOT_ACTION_TYPE.SET_ACCESS_MODE,
        payload: accessMode.getValue(),
      });
      dispatch({
        type: BOOT_ACTION_TYPE.SET_VOLUME_MODE,
        payload: volumeMode.getValue(),
      });
    },
    [dispatch],
  );

  const onStorageClassNameChanged = (newSC) => {
    handleStorageClass(newSC?.metadata?.name);
    handleAccessAndVolumeModeChange(spAccessMode, spVolumeMode);
  };

  React.useEffect(() => {
    if (storageClassesLoaded && !state.storageClass?.value) {
      if (defaultSCName) {
        handleStorageClass(defaultSCName);
      } else {
        const firstSc = storageClasses?.[0]?.metadata?.name;
        firstSc && handleStorageClass(firstSc);
      }
    }
  }, [storageClassesLoaded, defaultSCName, state.storageClass, storageClasses, handleStorageClass]);

  React.useEffect(() => {
    if (spLoaded && applySP && isSPSettingProvided) {
      handleAccessAndVolumeModeChange(spAccessMode, spVolumeMode);
    }
  }, [
    spLoaded,
    applySP,
    isSPSettingProvided,
    state.storageClass,
    spAccessMode,
    spVolumeMode,
    handleAccessAndVolumeModeChange,
  ]);

  return storageClassesLoaded && !scAllowedLoading ? (
    <Form>
      <FormRow fieldId="form-ds-sc" isRequired>
        <StorageClassDropdown
          name={t('kubevirt-plugin~Storage Class')}
          onChange={(sc) => onStorageClassNameChanged(sc)}
          data-test="storage-class-dropdown"
        />
      </FormRow>
      <>
        <FormRow fieldId="form-ds-apply-sp">
          <Checkbox
            id="apply-storage-provider"
            description={t(
              'kubevirt-plugin~Use optimized access mode & volume mode settings from StorageProfile resource.',
            )}
            isChecked={applySP}
            onChange={() => setApplySP(!applySP)}
            isDisabled={!isSPSettingProvided}
            label={t('kubevirt-plugin~Apply optimized StorageProfile settings')}
            data-test="apply-storage-provider"
          />
        </FormRow>
        {!spLoaded ? (
          <LoadingInline />
        ) : isSPSettingProvided && applySP ? (
          <FormRow fieldId="form-ds-sp-settings" data-test="sp-default-settings">
            {t('kubevirt-plugin~Access mode: {{accessMode}} / Volume mode: {{volumeMode}}', {
              accessMode: spAccessMode?.getValue(),
              volumeMode: spVolumeMode?.getValue(),
            })}
          </FormRow>
        ) : (
          <div data-test="sp-no-default-settings">
            <FormRow fieldId="form-ds-access-mode" isRequired>
              <AccessModeSelector
                onChange={(aMode) => {
                  dispatch({
                    type: BOOT_ACTION_TYPE.SET_ACCESS_MODE,
                    payload: aMode,
                  });
                }}
                provisioner={provisioner}
                loaded
                availableAccessModes={initialAccessModes}
              />
            </FormRow>
            <FormRow fieldId="form-ds-volume-mode" isRequired>
              <VolumeModeSelector
                onChange={(vMode) => {
                  dispatch({
                    type: BOOT_ACTION_TYPE.SET_VOLUME_MODE,
                    payload: vMode,
                  });
                }}
                provisioner={provisioner}
                accessMode={state.accessMode?.value}
                storageClass={storageClassName}
                loaded
              />
            </FormRow>
          </div>
        )}
      </>
    </Form>
  ) : (
    <LoadingInline />
  );
};

type BootSourceFormProps = AdvancedSectionProps & {
  withUpload?: boolean;
  baseImageName?: string;
};

export const BootSourceForm: React.FC<BootSourceFormProps> = ({
  state,
  dispatch,
  withUpload,
  baseImageName,
  disabled,
  storageClasses,
  storageClassesLoaded,
  scAllowed,
  scAllowedLoading,
}) => {
  const { t } = useTranslation();

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
          toggleId={getFieldId(VMSettingsField.PROVISION_SOURCE_TYPE)}
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
            onChange={(file: File, name: string) => {
              dispatch({
                type: BOOT_ACTION_TYPE.SET_FILE,
                payload: { value: file, name },
              });
              dispatch({
                type: BOOT_ACTION_TYPE.SET_PVC_SIZE,
                payload: getGiBUploadPVCSizeByImage(state.file?.value?.value?.size).toString(),
              });
            }}
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
            id={getFieldId(VMSettingsField.IMAGE_URL)}
          />
          <URLSourceHelp baseImageName={baseImageName} />
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
            onChange={(payload) =>
              dispatch({ type: BOOT_ACTION_TYPE.SET_CONTAINER, payload: payload?.trim() })
            }
            aria-label={t('kubevirt-plugin~Container image')}
            isDisabled={disabled}
            id={getFieldId(VMSettingsField.CONTAINER_IMAGE)}
          />
          <ContainerSourceHelp imageName={baseImageName} />
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
              id="pvc-ns-dropdown"
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
                    type: BOOT_ACTION_TYPE.SET_PVC_VOLUME_MODE,
                    payload: pvc?.spec?.volumeMode,
                  });
                  dispatch({
                    type: BOOT_ACTION_TYPE.SET_PVC_SIZE,
                    payload: pvc.spec.resources.requests.storage,
                  });
                  const pvcProvider = getAnnotation(pvc, ANNOTATION_SOURCE_PROVIDER);
                  if (pvcProvider) {
                    dispatch({
                      type: BOOT_ACTION_TYPE.SET_PROVIDER,
                      payload: pvcProvider,
                    });
                  }
                }}
                placeholder={t('kubevirt-plugin~--- Select Persistent Volume Claim ---')}
                desc={PersistentVolumeClaimModel.label}
                disabled={disabled}
                id="pvc-name-dropdown"
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
              {t('kubevirt-plugin~This is a CD-ROM boot source')}
              <FieldLevelHelp>
                {t(
                  'kubevirt-plugin~CD-ROM requires an additional disk for the operating system to be installed onto. This disk will be added and can be customized when creating the virtual machine.',
                )}
              </FieldLevelHelp>
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
        <FormRow fieldId="form-ds-provider" isRequired title={t('kubevirt-plugin~Source provider')}>
          <TextInput
            isDisabled={disabled}
            value={state.provider?.value}
            type="text"
            isRequired
            onChange={(payload) => dispatch({ type: BOOT_ACTION_TYPE.SET_PROVIDER, payload })}
            aria-label={t('kubevirt-plugin~Source provider')}
            id="form-ds-provider-input"
          />
          <div className="pf-c-form__helper-text" aria-live="polite">
            {t('kubevirt-plugin~Example: your company name')}
          </div>
        </FormRow>
      )}
      <ExpandableSection
        toggleText={t('kubevirt-plugin~Advanced Storage settings')}
        data-test="advanced-section"
      >
        <AdvancedSection
          state={state}
          dispatch={dispatch}
          disabled={disabled}
          storageClasses={storageClasses}
          storageClassesLoaded={storageClassesLoaded}
          scAllowed={scAllowed}
          scAllowedLoading={scAllowedLoading}
        />
      </ExpandableSection>
    </Form>
  );
};
