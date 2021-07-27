import * as React from 'react';
import {
  Alert,
  AlertVariant,
  Checkbox,
  Form,
  SelectOption,
  Stack,
  StackItem,
  TextInput,
} from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { AccessModeSelector } from '@console/app/src/components/access-modes/access-mode';
import { VolumeModeSelector } from '@console/app/src/components/volume-modes/volume-mode';
import { ModalBody, ModalComponentProps, ModalTitle } from '@console/internal/components/factory';
import { initialAccessModes } from '@console/internal/components/storage/shared';
import {
  ExternalLink,
  FirehoseResult,
  HandlePromiseProps,
  withHandlePromise,
} from '@console/internal/components/utils';
import { StorageClassDropdown } from '@console/internal/components/utils/storage-class-dropdown';
import { NamespaceModel, PersistentVolumeClaimModel } from '@console/internal/models';
import {
  ConfigMapKind,
  k8sCreate,
  PersistentVolumeClaimKind,
  StorageClassResourceKind,
} from '@console/internal/module/k8s';
import { DataVolumeModel } from '@console/kubevirt-plugin/src/models';
import {
  AccessMode,
  DataVolumeSourceType,
  DiskBus,
  DiskType,
  VolumeMode,
  VolumeType,
} from '../../../constants/vm/storage';
import { useShowErrorToggler } from '../../../hooks/use-show-error-toggler';
import { useStorageProfileSettings } from '../../../hooks/use-storage-profile-settings';
import { addHotplugPersistent } from '../../../k8s/requests/vm/actions';
import { addHotplugNonPersistent } from '../../../k8s/requests/vmi/actions';
import { CombinedDisk } from '../../../k8s/wrapper/vm/combined-disk';
import { DataVolumeWrapper } from '../../../k8s/wrapper/vm/data-volume-wrapper';
import { DiskWrapper } from '../../../k8s/wrapper/vm/disk-wrapper';
import { PersistentVolumeClaimWrapper } from '../../../k8s/wrapper/vm/persistent-volume-claim-wrapper';
import { VolumeWrapper } from '../../../k8s/wrapper/vm/volume-wrapper';
import { getPvcStorageSize } from '../../../selectors/pvc/selectors';
import { getName } from '../../../selectors/selectors';
import { VMIKind, VMKind } from '../../../types';
import { V1AddVolumeOptions } from '../../../types/api';
import { UIStorageEditConfig } from '../../../types/ui/storage';
import {
  getDialogUIError,
  getLoadedData,
  getSequenceName,
  prefixedID,
  resolveDataVolumeName,
} from '../../../utils';
import {
  DYNAMIC,
  PREALLOCATION_DATA_VOLUME_LINK,
  STORAGE_CLASS_SUPPORTED_RHV_LINK,
  STORAGE_CLASS_SUPPORTED_VMWARE_LINK,
} from '../../../utils/strings';
import { isFieldDisabled } from '../../../utils/ui/edit-config';
import { isValidationError } from '../../../utils/validations/common';
import { TemplateValidations } from '../../../utils/validations/template/template-validations';
import { validateDisk } from '../../../utils/validations/vm';
import { VMImportProvider } from '../../create-vm-wizard/types';
import { FormPFSelect } from '../../form/form-pf-select';
import { FormRow } from '../../form/form-row';
import { asFormSelectValue } from '../../form/form-select-placeholder-option';
import { ContainerSourceHelp } from '../../form/helper/container-source-help';
import { URLSourceHelp } from '../../form/helper/url-source-help';
import { K8sResourceSelectRow } from '../../form/k8s-resource-select-row';
import { SizeUnitFormRow } from '../../form/size-unit-form-row';
import { BinaryUnit, stringValueUnitSplit } from '../../form/size-unit-utils';
import { ModalFooter } from '../modal/modal-footer';
import { HotplugFieldLevelHelp } from './HotplugFieldLevelHelp';
import { StorageUISource } from './storage-ui-source';

import './disk-modal.scss';

export const DiskModal = withHandlePromise((props: DiskModalProps) => {
  const {
    showInitialValidation,
    usedPVCNames,
    persistentVolumeClaims,
    vmName,
    vmNamespace,
    namespace,
    namespaces,
    onNamespaceChanged,
    usedDiskNames,
    isTemplate = false,
    onSubmit,
    inProgress: _inProgress,
    isEditing,
    errorMessage,
    handlePromise,
    close,
    cancel,
    templateValidations,
    editConfig,
    isVMRunning,
    vm,
    vmi,
    importProvider,
    baseImageName,
  } = props;
  const { t } = useTranslation();

  const asId = prefixedID.bind(null, 'disk');
  const disk = props.disk || new DiskWrapper();
  const volume = props.volume || new VolumeWrapper();
  const dataVolume = props.dataVolume || new DataVolumeWrapper();
  const tValidations = templateValidations || new TemplateValidations();
  const [autoDetach, setAutoDetach] = React.useState(false);

  const combinedDisk = new CombinedDisk({
    diskWrapper: disk,
    volumeWrapper: volume,
    dataVolumeWrapper: dataVolume,
    persistentVolumeClaimWrapper: props.persistentVolumeClaim,
    isNewPVC: !!props.persistentVolumeClaim,
  });

  const [storageClassName, setStorageClassName] = React.useState<string>(
    combinedDisk.getStorageClassName() || '',
  );

  const [spAccessMode, spVolumeMode, spLoaded, isSPSettingProvided] = useStorageProfileSettings(
    storageClassName,
  );

  const [applySP, setApplySP] = React.useState<boolean>(true);

  const inProgress = _inProgress && !spLoaded;

  const isDisabled = (fieldName: string, disabled?: boolean) =>
    inProgress || disabled || isFieldDisabled(editConfig, fieldName);

  const combinedDiskSize = combinedDisk.getSize();

  const [type, setType] = React.useState<DiskType>(
    isVMRunning ? DiskType.DISK : disk.getType() || DiskType.DISK,
  );

  const [source, setSource] = React.useState<StorageUISource>(
    combinedDisk.getInitialSource(isEditing),
  );

  const [url, setURL] = React.useState<string>(dataVolume.getURL());

  const [containerImage, setContainerImage] = React.useState<string>(
    volume.getType() === VolumeType.CONTAINER_DISK
      ? volume.getContainerImage()
      : dataVolume.getContainer() || '',
  );

  const [pvcName, setPVCName] = React.useState<string>(combinedDisk.getPVCNameBySource(source));

  const [name, setName] = React.useState<string>(
    disk.getName() || getSequenceName('disk', usedDiskNames),
  );

  const validAllowedBuses = tValidations.getAllowedBuses(
    isEditing ? DiskType.DISK : disk.getType(),
  );
  const recommendedBuses = tValidations.getRecommendedBuses(
    isEditing ? DiskType.DISK : disk.getType(),
  );
  const allowedBuses = [...validAllowedBuses].filter((b) => type.isBusSupported(b));

  const [bus, setBus] = React.useState<DiskBus>(
    isVMRunning
      ? DiskBus.SCSI
      : disk.getDiskBus() ||
          (isEditing
            ? null
            : validAllowedBuses.has(DiskBus.VIRTIO)
            ? DiskBus.VIRTIO
            : allowedBuses[0]),
  );

  const [size, setSize] = React.useState<string>(
    combinedDiskSize ? `${combinedDiskSize.value}` : '',
  );
  const [unit, setUnit] = React.useState<string>(
    (combinedDiskSize && combinedDiskSize.unit) || BinaryUnit.Gi,
  );

  const [accessMode, setAccessMode] = React.useState<AccessMode>(
    isEditing ? (combinedDisk.getAccessModes() || [])[0] : applySP ? spAccessMode : null,
  );

  const [volumeMode, setVolumeMode] = React.useState<VolumeMode>(
    isEditing ? combinedDisk.getVolumeMode() : applySP ? spVolumeMode : null,
  );

  const [storageProvisioner, setStorageProvisioner] = React.useState('');
  const [accessModeHelp, setAccessModeHelp] = React.useState('Permissions to the mounted drive.');

  const [enablePreallocation, setEnablePreallocation] = React.useState<boolean>(
    dataVolume.getPreallocation(),
  );
  const pvcNameDataVolume = dataVolume.getPersistentVolumeClaimName();

  React.useEffect(() => {
    if (source.requiresPVC()) {
      const pvcNamespaceDataVolume = dataVolume.getPersistentVolumeClaimNamespace();
      const pvc = persistentVolumeClaims?.data.find(
        ({ metadata }) =>
          metadata?.name === pvcNameDataVolume && metadata?.namespace === pvcNamespaceDataVolume,
      );
      setVolumeMode((value) => VolumeMode.fromString(pvc?.spec?.volumeMode) || value);
    }
  }, [dataVolume, persistentVolumeClaims, pvcNameDataVolume, source]);

  const resultDisk = DiskWrapper.initializeFromSimpleData({
    name,
    bus,
    type,
  });

  // We can generate a random name every time, because this modal should not operate on disks with live datavolumes
  const resultDataVolumeName = resolveDataVolumeName({
    diskName: name,
    vmLikeEntityName: vmName,
    isTemplate,
  });

  const resultVolume = VolumeWrapper.initializeFromSimpleData({
    name,
    type: source.getVolumeType(),
    typeData: {
      name: resultDataVolumeName,
      claimName: pvcName,
      image: containerImage,
    },
  });

  let resultDataVolume: DataVolumeWrapper;
  if (source.requiresDatavolume()) {
    resultDataVolume = new DataVolumeWrapper()
      .init({
        name: resultDataVolumeName,
        unit,
        size,
        storageClassName: storageClassName || null, // || null is to enable merging
      })
      .setType(source.getDataVolumeSourceType(), {
        name: pvcName,
        namespace,
        url:
          source.getDataVolumeSourceType() === DataVolumeSourceType.REGISTRY ? containerImage : url,
      })
      .setVolumeMode(volumeMode || null)
      .setAccessModes(accessMode ? [accessMode] : null)
      .setPreallocationDisk(enablePreallocation)
      .setNamespace(vmNamespace);
  }

  let resultPersistentVolumeClaim: PersistentVolumeClaimWrapper;
  if (source.requiresNewPVC()) {
    resultPersistentVolumeClaim = new PersistentVolumeClaimWrapper()
      .init({
        name,
        storageClassName: storageClassName || null, // || null is to enable merging
        size,
        unit,
      })
      .setVolumeMode(applySP && spVolumeMode ? spVolumeMode : volumeMode || null)
      .setAccessModes(applySP && spAccessMode ? [spAccessMode] : accessMode ? [accessMode] : null);
  }

  const {
    validations: {
      name: nameValidation,
      size: sizeValidation,
      container: containerValidation,
      pvc: pvcValidation,
      diskInterface: busValidation,
      url: urlValidation,
      type: typeValidation,
    },
    isValid,
    hasAllRequiredFilled,
  } = validateDisk(resultDisk, resultVolume, resultDataVolume, resultPersistentVolumeClaim, {
    usedDiskNames,
    usedPVCNames,
    templateValidations,
  });

  const [showUIError, setShowUIError] = useShowErrorToggler(
    !!showInitialValidation,
    isValid,
    isValid,
  );

  const bodyRequestAddVolume: V1AddVolumeOptions = {
    disk: resultDisk.asResource(true),
    name,
    volumeSource: {
      dataVolume: {
        name: resultDataVolumeName,
      },
    },
  };

  const submit = (e) => {
    e.preventDefault();

    if (isValid) {
      if (isVMRunning) {
        const dvRequest = k8sCreate(DataVolumeModel, resultDataVolume.asResource(true));
        if (autoDetach) {
          handlePromise(
            dvRequest.then(() => addHotplugNonPersistent(vmi, bodyRequestAddVolume)),
            close,
          );
        } else {
          handlePromise(
            dvRequest.then(() => addHotplugPersistent(vm, bodyRequestAddVolume)),
            close,
          );
        }
      } else {
        handlePromise(
          onSubmit(resultDisk, resultVolume, resultDataVolume, resultPersistentVolumeClaim),
          close,
        );
      }
    } else {
      setShowUIError(true);
    }
  };

  const onNameChanged = React.useCallback(
    (v) => {
      if (source.requiresNewPVC()) {
        setPVCName(v);
      }
      setName(v);
    },
    [setName, setPVCName, source],
  );

  const onStorageClassNameChanged = (newSC) => {
    const provisioner: string = newSC?.provisioner || '';
    const displayMessage = !isSPSettingProvided
      ? `${t('kubevirt-plugin~Access mode is set by StorageClass and cannot be changed')}`
      : `${t('kubevirt-plugin~Permissions to the mounted drive')}`;

    setAccessModeHelp(displayMessage);
    setStorageClassName(newSC?.metadata?.name);
    setStorageProvisioner(provisioner);
    if (applySP && isSPSettingProvided) {
      setAccessMode(spAccessMode);
      setVolumeMode(spVolumeMode);
    }
  };

  const onSourceChanged = (e, uiSource) => {
    setSize('');
    setUnit('Gi');
    setURL('');
    setPVCName('');
    setContainerImage('');
    onNamespaceChanged(vmNamespace);
    setSource(StorageUISource.fromString(uiSource));
  };

  const onPVCChanged = (newPVCName) => {
    setPVCName(newPVCName);
    if (source === StorageUISource.ATTACH_CLONED_DISK) {
      const newSizeBundle = getPvcStorageSize(
        getLoadedData(persistentVolumeClaims).find((p) => getName(p) === newPVCName),
      );
      const [newSize, newUnit] = stringValueUnitSplit(newSizeBundle);
      setSize(newSize);
      setUnit(newUnit);
    }
  };

  const onTypeChanged = (diskType) => {
    const newType = DiskType.fromString(diskType);
    setType(newType);
    if (newType === DiskType.CDROM && source === StorageUISource.BLANK) {
      onSourceChanged(null, StorageUISource.URL.getValue());
    }
    if (newType === DiskType.CDROM && bus === DiskBus.VIRTIO) {
      setBus(DiskBus.SATA);
    }
  };

  const onTogglePreallocation = () => setEnablePreallocation(!enablePreallocation);

  let modalTitle;
  if (isVMRunning) {
    modalTitle = isEditing
      ? t('kubevirt-plugin~Edit {{type}} (Hot-plugged)', { type })
      : t('kubevirt-plugin~Add {{type}} (Hot-plugged)', { type });
  } else {
    modalTitle = isEditing
      ? t('kubevirt-plugin~Edit {{type}}', { type })
      : t('kubevirt-plugin~Add {{type}}', { type });
  }
  return (
    <div className="modal-content">
      <ModalTitle>
        {modalTitle}
        {isVMRunning && <HotplugFieldLevelHelp />}
      </ModalTitle>
      <ModalBody>
        <Form>
          <FormRow title={t('kubevirt-plugin~Source')} fieldId={asId('source')} isRequired>
            <FormPFSelect
              menuAppendTo={() => document.body}
              isDisabled={isDisabled('source', !source.canBeChangedToThisSource(type))}
              selections={asFormSelectValue(t(source.toString()))}
              onSelect={onSourceChanged}
              toggleId={asId('select-source')}
            >
              {StorageUISource.getAll()
                .filter(
                  (storageUISource) =>
                    storageUISource.hotplugDiskSources(type, isVMRunning) ||
                    !source.hotplugDiskSources(type, isVMRunning),
                )
                .sort((a, b) => a.getOrder() - b.getOrder())
                .map((uiType) => {
                  return (
                    <SelectOption
                      key={uiType.getValue()}
                      value={uiType.getValue()}
                      description={t(uiType.getDescriptionKey())}
                    >
                      {t(uiType.toString())}
                    </SelectOption>
                  );
                })}
            </FormPFSelect>
          </FormRow>
          {source.requiresURL() && (
            <FormRow
              title={t('kubevirt-plugin~URL')}
              fieldId={asId('url')}
              isRequired
              validation={urlValidation}
            >
              <TextInput
                validated={!isValidationError(urlValidation) ? 'default' : 'error'}
                key="url"
                isDisabled={isDisabled('url')}
                isRequired
                id={asId('url')}
                value={url}
                onChange={setURL}
              />
              <URLSourceHelp baseImageName={baseImageName} />
            </FormRow>
          )}
          {source.requiresContainerImage() && (
            <FormRow
              title={t('kubevirt-plugin~Container')}
              fieldId={asId('container')}
              isRequired
              validation={containerValidation}
            >
              <TextInput
                validated={!isValidationError(containerValidation) ? 'default' : 'error'}
                key="container"
                isDisabled={isDisabled('container')}
                isRequired
                id={asId('container')}
                value={containerImage}
                onChange={setContainerImage}
              />
              <ContainerSourceHelp />
            </FormRow>
          )}
          {source.requiresNamespace() && (
            <K8sResourceSelectRow
              key="pvc-namespace"
              id={asId('pvc-namespace')}
              isDisabled={isDisabled('pvcNamespace')}
              name={namespace}
              data={namespaces}
              model={NamespaceModel}
              title={`PVC ${NamespaceModel.label}`}
              onChange={(ns) => {
                setPVCName('');
                onNamespaceChanged(ns);
              }}
            />
          )}
          {source.requiresPVC() && (
            <K8sResourceSelectRow
              key="pvc-select"
              id={asId('pvc')}
              isDisabled={isDisabled('pvc', !namespace)}
              isRequired
              name={pvcName}
              validation={pvcValidation}
              data={persistentVolumeClaims}
              model={PersistentVolumeClaimModel}
              hasPlaceholder
              isPlaceholderDisabled
              onChange={onPVCChanged}
              filter={(p) => !(usedPVCNames && usedPVCNames.has(getName(p)))}
            />
          )}
          <FormRow
            title={t('kubevirt-plugin~Name')}
            fieldId={asId('name')}
            isRequired
            isLoading={!usedDiskNames}
            validation={nameValidation}
          >
            <TextInput
              validated={!isValidationError(nameValidation) ? 'default' : 'error'}
              isDisabled={isDisabled('name', !usedDiskNames)}
              isRequired
              id={asId('name')}
              value={name}
              onChange={onNameChanged}
            />
          </FormRow>

          {source.requiresSize() && (
            <SizeUnitFormRow
              title={t('kubevirt-plugin~Size')}
              key="size-row"
              id={asId('size-row')}
              size={size}
              unit={unit as BinaryUnit}
              units={source.getAllowedUnits()}
              validation={sizeValidation}
              isDisabled={isDisabled(
                'size',
                !source.isSizeEditingSupported(combinedDiskSize?.value),
              )}
              isRequired
              onSizeChanged={
                source.isSizeEditingSupported(combinedDiskSize?.value) ? setSize : undefined
              }
              onUnitChanged={
                source.isSizeEditingSupported(combinedDiskSize?.value) ? setUnit : undefined
              }
            />
          )}
          {!source.requiresSize() && source.hasDynamicSize() && (
            <FormRow title={t('kubevirt-plugin~Size')} fieldId={asId('dynamic-size-row')}>
              <TextInput
                key="dynamic-size-row"
                isDisabled
                id={asId('dynamic-size-row')}
                value={DYNAMIC}
              />
            </FormRow>
          )}
          <FormRow
            title={t('kubevirt-plugin~Type')}
            fieldId={asId('type')}
            isRequired
            validation={typeValidation}
          >
            <FormPFSelect
              menuAppendTo={() => document.body}
              isDisabled={isDisabled('type')}
              selections={asFormSelectValue(t(type.getValue()))}
              onSelect={(e, val) => onTypeChanged(val)}
              toggleId={asId('type')}
            >
              {DiskType.getAll()
                .filter((dtype) => !dtype.isDeprecated() || dtype === type)
                .map((dt) => (
                  <SelectOption
                    key={dt.getValue()}
                    value={dt.getValue()}
                    description={t('kubevirt-plugin~Hotplug is enabled only for "Disk" type')}
                    isDisabled={isVMRunning && dt.getValue() !== DiskType.DISK.getValue()}
                  >
                    {t(dt.toString())}
                  </SelectOption>
                ))}
            </FormPFSelect>
          </FormRow>
          <FormRow fieldId={asId('auto-detach')}>
            <Checkbox
              id={asId('auto-detach')}
              label={t('kubevirt-plugin~Automatically detach this disk upon VM restart.')}
              description={t(
                'kubevirt-plugin~Enable automatic detachment is available only for hot-plugged disks.',
              )}
              isDisabled={!isVMRunning}
              isChecked={autoDetach}
              onChange={() => setAutoDetach(!autoDetach)}
            />
          </FormRow>
          <FormRow
            title={t('kubevirt-plugin~Interface')}
            fieldId={asId('interface')}
            isRequired
            validation={busValidation}
          >
            <FormPFSelect
              menuAppendTo={() => document.body}
              isDisabled={isDisabled('interface')}
              selections={asFormSelectValue(t(bus.toString()))}
              onSelect={React.useCallback(
                (e, diskBus) => setBus(DiskBus.fromString(diskBus.toString())),
                [setBus],
              )}
              toggleId={asId('select-interface')}
            >
              {allowedBuses.map((b) => (
                <SelectOption
                  key={b.getValue()}
                  value={b.getValue()}
                  description={t(b.getDescriptionKey())}
                  isDisabled={isVMRunning && b.getValue() !== DiskBus.SCSI.getValue()}
                >
                  {t(b.toString())}
                  {recommendedBuses.size !== validAllowedBuses.size && recommendedBuses.has(b)
                    ? t('kubevirt-plugin~ --- Recommended ---')
                    : ''}
                </SelectOption>
              ))}
            </FormPFSelect>
          </FormRow>
          {source.requiresStorageClass() && (
            <Stack hasGutter>
              {importProvider && (
                <StackItem>
                  <Alert
                    variant={AlertVariant.warning}
                    isInline
                    title={t('kubevirt-plugin~Supported Storage classes')}
                  >
                    <ExternalLink
                      text={t('kubevirt-plugin~Supported Storage classes for selected provider')}
                      href={
                        importProvider === VMImportProvider.OVIRT
                          ? STORAGE_CLASS_SUPPORTED_RHV_LINK
                          : STORAGE_CLASS_SUPPORTED_VMWARE_LINK
                      }
                    />
                  </Alert>
                </StackItem>
              )}
              <StackItem>
                <StorageClassDropdown
                  name={t('kubevirt-plugin~Storage Class')}
                  onChange={(scName) => onStorageClassNameChanged(scName)}
                />
              </StackItem>
              {source.requiresVolumeModeOrAccessModes() && (
                <>
                  <StackItem>
                    <Checkbox
                      id="apply-storage-provider"
                      description={t(
                        'kubevirt-plugin~Use optimized access mode & volume mode settings from StorageProfile resource.',
                      )}
                      isChecked={applySP}
                      onChange={() => setApplySP(!applySP)}
                      isDisabled={!isSPSettingProvided}
                      label={t('kubevirt-plugin~Apply optimized StorageProfile settings')}
                    />
                  </StackItem>
                  {isSPSettingProvided && applySP ? (
                    <StackItem>
                      {t(
                        'kubevirt-plugin~Access mode: {{accessMode}} / Volume mode: {{volumeMode}}',
                        {
                          accessMode: spAccessMode?.getValue(),
                          volumeMode: spVolumeMode?.getValue(),
                        },
                      )}
                    </StackItem>
                  ) : (
                    <>
                      <StackItem>
                        <AccessModeSelector
                          onChange={(aMode) => setAccessMode(AccessMode.fromString(aMode))}
                          provisioner={storageProvisioner}
                          loaded
                          availableAccessModes={initialAccessModes}
                          description={accessModeHelp}
                        />
                      </StackItem>
                      <StackItem>
                        <VolumeModeSelector
                          onChange={(vMode) => setVolumeMode(VolumeMode.fromString(vMode))}
                          provisioner={storageProvisioner}
                          accessMode={accessMode?.getValue()}
                          storageClass={storageClassName}
                          loaded
                        />
                      </StackItem>
                    </>
                  )}
                </>
              )}
              <StackItem>
                <Checkbox
                  id="cnv668"
                  description={
                    <Trans t={t} ns="kubevirt-plugin">
                      Refer to the{' '}
                      <ExternalLink
                        text={t('kubevirt-plugin~Documentation')}
                        href={PREALLOCATION_DATA_VOLUME_LINK}
                      />{' '}
                      or contact your system administrator for more information. Enabling
                      preallocation is available only for blank disk source.
                    </Trans>
                  }
                  isDisabled={!source.requiresBlankDisk()}
                  isChecked={enablePreallocation}
                  label={t('kubevirt-plugin~Enable preallocation')}
                  onChange={() => onTogglePreallocation()}
                />
              </StackItem>
            </Stack>
          )}
        </Form>
      </ModalBody>
      <ModalFooter
        id="disk"
        submitButtonText={isEditing ? t('kubevirt-plugin~Save') : t('kubevirt-plugin~Add')}
        errorMessage={
          errorMessage || (showUIError ? getDialogUIError(hasAllRequiredFilled, t) : null)
        }
        isDisabled={inProgress}
        inProgress={inProgress}
        isSimpleError={showUIError}
        onSubmit={submit}
        onCancel={(e) => {
          e.stopPropagation();
          cancel();
        }}
      />
    </div>
  );
});

export type DiskModalProps = {
  disk?: DiskWrapper;
  showInitialValidation?: boolean;
  isTemplate?: boolean;
  isEditing?: boolean;
  volume?: VolumeWrapper;
  dataVolume?: DataVolumeWrapper;
  persistentVolumeClaim?: PersistentVolumeClaimWrapper;
  storageClassConfigMap?: FirehoseResult<ConfigMapKind>;
  onSubmit: (
    disk: DiskWrapper,
    volume: VolumeWrapper,
    dataVolume: DataVolumeWrapper,
    persistentVolumeClaim?: PersistentVolumeClaimWrapper,
  ) => Promise<any>;
  namespaces?: FirehoseResult;
  storageClasses?: FirehoseResult<StorageClassResourceKind[]>;
  persistentVolumeClaims?: FirehoseResult<PersistentVolumeClaimKind[]>;
  vmName: string;
  vmNamespace: string;
  namespace: string;
  onNamespaceChanged: (namespace: string) => void;
  templateValidations?: TemplateValidations;
  usedDiskNames: Set<string>;
  usedPVCNames: Set<string>;
  editConfig?: UIStorageEditConfig;
  baseImageName?: string;
  isVMRunning?: boolean;
  vm?: VMKind;
  vmi?: VMIKind;
  importProvider?: VMImportProvider;
} & ModalComponentProps &
  HandlePromiseProps;
