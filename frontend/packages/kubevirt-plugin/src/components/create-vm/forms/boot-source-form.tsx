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
  Popover,
  PopoverPosition,
} from '@patternfly/react-core';
import { HelpIcon } from '@patternfly/react-icons';
import { PersistentVolumeClaimModel, StorageClassModel } from '@console/internal/models';
import {
  ListDropdown,
  LoadingInline,
  RequestSizeInput,
  useAccessReview2,
} from '@console/internal/components/utils';
import {
  dropdownUnits,
  getAccessModeForProvisioner,
  provisionerAccessModeMapping,
} from '@console/internal/components/storage/shared';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';

import { FormRow } from '../../form/form-row';
import { ProjectDropdown } from '../../form/project-dropdown';
import { BootSourceAction, BootSourceState, BOOT_ACTION_TYPE } from './boot-source-form-reducer';
import { AccessMode, VolumeMode, ANNOTATION_SOURCE_PROVIDER } from '../../../constants';
import { FormPFSelect } from '../../form/form-pf-select';
import { preventDefault } from '../../form/utils';
import { ProvisionSource } from '../../../constants/vm/provision-source';
import { URLSourceHelp } from '../../form/helper/url-source-help';
import { ContainerSourceHelp } from '../../form/helper/container-source-help';
import { useStorageClassConfigMap } from '../../../hooks/storage-class-config-map';
import {
  getDefaultSCAccessModes,
  getDefaultSCVolumeMode,
  getDefaultStorageClass,
  isConfigMapContainsScModes,
} from '../../../selectors/config-map/sc-defaults';
import { getAnnotation } from '../../../selectors/selectors';
import { getFieldId } from '../../create-vm-wizard/utils/renderable-field-utils';
import { VMSettingsField } from '../../create-vm-wizard/types';
import { ConfigMapDefaultModesAlert } from '../../Alerts/ConfigMapDefaultModesAlert';

type AdvancedSectionProps = {
  state: BootSourceState;
  dispatch: React.Dispatch<BootSourceAction>;
  disabled?: boolean;
};

const AdvancedSection: React.FC<AdvancedSectionProps> = ({ state, dispatch, disabled }) => {
  const { t } = useTranslation();
  const [scAllowed, scAllowedLoading] = useAccessReview2({
    group: StorageClassModel.apiGroup,
    resource: StorageClassModel.plural,
    verb: 'list',
  });
  const [storageClasses, scLoaded] = useK8sWatchResource<StorageClassResourceKind[]>(
    scAllowed
      ? {
          kind: StorageClassModel.kind,
          isList: true,
          namespaced: false,
        }
      : null,
  );
  const [scConfigMap, cmLoaded] = useStorageClassConfigMap();

  const defaultSCName = getDefaultStorageClass(storageClasses)?.metadata.name;

  const updatedStorageClass = storageClasses?.find(
    (sc) => sc.metadata.name === state.storageClass?.value,
  );
  const storageClassName = updatedStorageClass?.metadata?.name;
  const provisioner = updatedStorageClass?.provisioner || '';
  let accessModes: string[] =
    provisionerAccessModeMapping[provisioner] || getAccessModeForProvisioner(provisioner);

  if (!scAllowedLoading && !scAllowed && scConfigMap) {
    accessModes = getDefaultSCAccessModes(scConfigMap).map((am) => am.getValue());
  }

  const [defaultAccessMode, defaultVolumeMode, isScModesKnown] = React.useMemo(() => {
    return [
      getDefaultSCAccessModes(scConfigMap, storageClassName)?.[0],
      getDefaultSCVolumeMode(scConfigMap, storageClassName),
      isConfigMapContainsScModes(scConfigMap, storageClassName),
    ];
  }, [scConfigMap, storageClassName]);

  const handleStorageClass = React.useCallback(
    (scName: string) => {
      dispatch({
        type: BOOT_ACTION_TYPE.SET_STORAGE_CLASS,
        payload: scName,
      });
    },
    [dispatch],
  );

  React.useEffect(() => {
    if (!scAllowedLoading && scLoaded && cmLoaded && !state.storageClass?.value) {
      if (defaultSCName) {
        handleStorageClass(defaultSCName);
      } else {
        handleStorageClass(storageClasses?.[0]?.metadata?.name);
      }
    }
  }, [
    defaultSCName,
    handleStorageClass,
    scLoaded,
    state.storageClass,
    dispatch,
    scConfigMap,
    cmLoaded,
    scAllowedLoading,
    storageClasses,
  ]);

  React.useEffect(() => {
    if (state.storageClass?.value) {
      if (defaultAccessMode.getValue() !== state?.accessMode?.value) {
        dispatch({
          type: BOOT_ACTION_TYPE.SET_ACCESS_MODE,
          payload: defaultAccessMode.getValue(),
        });
      }

      if (defaultVolumeMode.getValue() !== state?.volumeMode?.value) {
        dispatch({
          type: BOOT_ACTION_TYPE.SET_VOLUME_MODE,
          payload: defaultVolumeMode.getValue(),
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultAccessMode, defaultVolumeMode, state.storageClass]);

  React.useEffect(() => {
    const isPVC = state.dataSource?.value === ProvisionSource.DISK.getValue();
    dispatch({
      type: BOOT_ACTION_TYPE.SET_VOLUME_MODE,
      payload: isPVC ? state.pvcVolumeMode?.value : defaultVolumeMode.getValue(),
    });
    dispatch({
      type: BOOT_ACTION_TYPE.SET_VOLUME_MODE_FLAG,
      payload: isPVC,
    });
  }, [state.pvcVolumeMode, state.dataSource, dispatch, defaultVolumeMode]);

  return cmLoaded && scLoaded && !scAllowedLoading ? (
    <Form>
      {scAllowed && (
        <FormRow fieldId="form-ds-sc" title={t('kubevirt-plugin~Storage class')} isRequired>
          <FormPFSelect
            value={state.storageClass?.value}
            onSelect={(e, value: string) => handleStorageClass(value)}
            aria-label={t('kubevirt-plugin~Select Storage Class')}
            selections={[state.storageClass?.value]}
            isDisabled={disabled}
            toggleId="form-ds-sc-select"
          >
            {storageClasses?.map((sc) => (
              <SelectOption key={sc.metadata.uid} value={sc.metadata.name}>
                {defaultSCName === sc.metadata.name
                  ? t('kubevirt-plugin~{{name}} (default)', { name: sc.metadata.name })
                  : sc.metadata.name}
              </SelectOption>
            ))}
          </FormPFSelect>
        </FormRow>
      )}
      <FormRow fieldId="form-ds-access-mode" title={t('kubevirt-plugin~Access mode')} isRequired>
        <FormPFSelect
          aria-label={t('kubevirt-plugin~Select access mode')}
          onSelect={(e, value: AccessMode) =>
            dispatch({
              type: BOOT_ACTION_TYPE.SET_ACCESS_MODE,
              payload: value.getValue(),
            })
          }
          selections={AccessMode.fromString(state.accessMode?.value)}
          isDisabled={!scAllowed || disabled}
          toggleId="form-ds-access-mode-select"
        >
          {accessModes.map((am) => {
            const accessMode = AccessMode.fromString(am);
            return (
              <SelectOption key={accessMode.getValue()} value={accessMode}>
                {accessMode.toString().concat(
                  accessMode.getValue() !== defaultAccessMode.getValue() && isScModesKnown
                    ? t(
                        'kubevirt-plugin~ - Not recommended for {{storageClassName}} storage class',
                        {
                          storageClassName,
                        },
                      )
                    : '',
                )}
              </SelectOption>
            );
          })}
        </FormPFSelect>
      </FormRow>
      <FormRow fieldId="form-ds-volume-mode" title={t('kubevirt-plugin~Volume mode')} isRequired>
        <FormPFSelect
          aria-label={t('kubevirt-plugin~Select volume mode')}
          onSelect={(e, value: VolumeMode) =>
            dispatch({
              type: BOOT_ACTION_TYPE.SET_VOLUME_MODE,
              payload: value.getValue(),
            })
          }
          selections={VolumeMode.fromString(state.volumeMode?.value)}
          isDisabled={disabled || state.volumeModeFlag.value}
          toggleId="form-ds-volume-mode-select"
        >
          {VolumeMode.getAll().map((vm) => (
            <SelectOption key={vm.getValue()} value={vm}>
              {vm.toString().concat(
                vm.getValue() !== defaultVolumeMode.getValue() && isScModesKnown
                  ? t('kubevirt-plugin~ - Not recommended for {{storageClassName}} storage class', {
                      storageClassName,
                    })
                  : '',
              )}
            </SelectOption>
          ))}
        </FormPFSelect>
        {state.volumeModeFlag.value && (
          <div className="pf-c-form__helper-text" aria-live="polite">
            {t('kubevirt-plugin~Volume Mode is set by Source PVC')}
          </div>
        )}
      </FormRow>
      <FormRow fieldId="form-sc-alert">
        <ConfigMapDefaultModesAlert isScModesKnown={isScModesKnown} />
      </FormRow>
    </Form>
  ) : (
    <LoadingInline />
  );
};

type BootSourceFormProps = AdvancedSectionProps & {
  withUpload?: boolean;
};

export const BootSourceForm: React.FC<BootSourceFormProps> = ({
  state,
  dispatch,
  withUpload,
  disabled,
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
            id={getFieldId(VMSettingsField.IMAGE_URL)}
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
            id={getFieldId(VMSettingsField.CONTAINER_IMAGE)}
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
              {t('kubevirt-plugin~Mount this as a CD-ROM boot source')}
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
            id="form-ds-provider-input"
          />
          <div className="pf-c-form__helper-text" aria-live="polite">
            {t('kubevirt-plugin~Example: your company name')}
          </div>
        </FormRow>
      )}
      <ExpandableSection toggleText={t('kubevirt-plugin~Advanced')}>
        <AdvancedSection state={state} dispatch={dispatch} disabled={disabled} />
      </ExpandableSection>
    </Form>
  );
};
