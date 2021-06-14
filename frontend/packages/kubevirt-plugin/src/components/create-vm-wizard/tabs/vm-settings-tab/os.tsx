import * as React from 'react';
import { Button, ButtonVariant, Checkbox, SelectOption, Text } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ResourceLink, useAccessReview } from '@console/internal/components/utils';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { asValidationObject, ValidationErrorType } from '@console/shared/src/utils/validation';
import { getPVCUploadURL } from '../../../../constants';
import { operatingSystemsNative } from '../../../../constants/vm-templates/os';
import { iGetAnnotation } from '../../../../selectors/immutable/common';
import { getTemplateOperatingSystems } from '../../../../selectors/vm-template/advanced';
import {
  getFlavors,
  getWorkloadProfiles,
} from '../../../../selectors/vm-template/combined-dependent';
import { OperatingSystemRecord } from '../../../../types';
import {
  iGet,
  iGetIsLoaded,
  iGetLoadedData,
  iGetLoadError,
  immutableListToShallowJS,
  toShallowJS,
} from '../../../../utils/immutable';
import { flavorSort, ignoreCaseSort } from '../../../../utils/sort';
import {
  CDI_UPLOAD_OS_URL_PARAM,
  CDI_UPLOAD_POD_ANNOTATION,
  CDI_PVC_PHASE_RUNNING,
} from '../../../cdi-upload-provider/consts';
import { FormPFSelect } from '../../../form/form-pf-select';
import { FormField, FormFieldType } from '../../form/form-field';
import { FormFieldRow } from '../../form/form-field-row';
import { iGetFieldValue } from '../../selectors/immutable/field';
import { iGetName, iGetNamespace } from '../../selectors/immutable/selectors';
import { VMSettingsField } from '../../types';
import { getFieldId } from '../../utils/renderable-field-utils';
import { nullOnEmptyChange } from '../../utils/utils';

export const OS: React.FC<OSProps> = React.memo(
  ({
    iUserTemplate,
    commonTemplates,
    operatinSystemField,
    cloneBaseDiskImageField,
    isCreateTemplate,
    mountWindowsGuestToolsField,
    flavor,
    workloadProfile,
    cnvBaseImages,
    onChange,
    openshiftFlag,
    goToStorageStep,
  }) => {
    const { t } = useTranslation();
    const os = iGetFieldValue(operatinSystemField);
    const display = iGet(operatinSystemField, 'display');
    const displayOnly = !!display;
    const cloneBaseDiskImage = iGetFieldValue(cloneBaseDiskImageField);
    const mountWindowsGuestTools = iGetFieldValue(mountWindowsGuestToolsField);
    const isUserTemplateValid = iGetIsLoaded(iUserTemplate) && !iGetLoadError(iUserTemplate);

    const params = {
      flavor,
      workload: workloadProfile,
      os,
    };

    const templates = iUserTemplate
      ? isUserTemplateValid
        ? [toShallowJS(iGetLoadedData(iUserTemplate))]
        : []
      : immutableListToShallowJS(iGetLoadedData(commonTemplates));

    let operatingSystems;

    if (displayOnly) {
      operatingSystems = [{ name: display, id: display }];
    } else {
      operatingSystems = openshiftFlag
        ? ignoreCaseSort(getTemplateOperatingSystems(templates), ['name'])
        : operatingSystemsNative;
    }

    const flavors = flavorSort(getFlavors(templates, params));

    const workloadProfiles = getWorkloadProfiles(templates, params);

    const loadingResources: any = openshiftFlag
      ? {
          commonTemplates,
        }
      : {};

    if (iUserTemplate) {
      loadingResources.iUserTemplate = iUserTemplate;
    }

    if (cnvBaseImages && !iGetIsLoaded(cnvBaseImages) && !iGetLoadError(cnvBaseImages)) {
      loadingResources.cnvBaseImages = cnvBaseImages;
    }

    let operatingSystemValidation;

    if (
      iGetIsLoaded(commonTemplates) &&
      (!iUserTemplate || isUserTemplateValid) &&
      (operatingSystems.length === 0 || flavors.length === 0 || workloadProfiles.length === 0)
    ) {
      // t('kubevirt-plugin~There is no valid template for this combination. Please install required template or select different os/flavor/workload profile combination.')
      const validation = asValidationObject(
        'kubevirt-plugin~There is no valid template for this combination. Please install required template or select different os/flavor/workload profile combination.',
        ValidationErrorType.Info,
      );
      if (!operatinSystemField.get('validation')) {
        operatingSystemValidation = validation;
      }
    }

    const osSystemRecord = operatingSystems?.find((image) => image.id === os);
    const canUploadGoldenImage = useAccessReview({
      group: PersistentVolumeClaimModel.apiGroup,
      resource: PersistentVolumeClaimModel.plural,
      namespace: osSystemRecord?.dataVolumeNamespace,
      verb: 'create',
    });

    const loadedBaseImages = iGetLoadedData(cnvBaseImages);
    const baseImagesLoadError = iGetLoadError(cnvBaseImages);
    const operatingSystemBaseImages = operatingSystems.map(
      (operatingSystem: OperatingSystemRecord) => {
        const pvcName = operatingSystem?.baseImageName;
        const pvcNamespace = operatingSystem?.baseImageNamespace;
        const baseImageFoundInCluster = loadedBaseImages?.find(
          (pvc) => iGetName(pvc) === pvcName && iGetNamespace(pvc) === pvcNamespace,
        );
        const isBaseImageUploading =
          iGetAnnotation(baseImageFoundInCluster, CDI_UPLOAD_POD_ANNOTATION) ===
          CDI_PVC_PHASE_RUNNING;
        const osField: any = {
          id: operatingSystem.id,
          name: operatingSystem.name,
          baseImageFoundInCluster,
          message: '',
          longMessage: '',
          checkboxDescription: '',
        };

        if (!iUserTemplate && !baseImagesLoadError) {
          if (baseImageFoundInCluster && pvcName && pvcNamespace) {
            if (isBaseImageUploading) {
              osField.message = t('kubevirt-plugin~(Source uploading)');
              osField.checkboxDescription = t(
                'kubevirt-plugin~The upload process for this Operating system must complete before it can be cloned',
              );
            } else {
              osField.message = t('kubevirt-plugin~(Source available)');
              osField.pvcName = pvcName;
              osField.pvcNamespace = pvcNamespace;
            }
          } else if (pvcName && pvcNamespace) {
            osField.longMessage = canUploadGoldenImage ? (
              <Trans t={t} ns="kubevirt-plugin">
                Operating system image not available. You can either{' '}
                <Link
                  className="co-external-link"
                  to={`${getPVCUploadURL(pvcNamespace)}?${CDI_UPLOAD_OS_URL_PARAM}=${
                    operatingSystem.id
                  }`}
                >
                  upload a new disk image
                </Link>{' '}
                or define a boot source manually in the boot source dropdown
              </Trans>
            ) : (
              <>
                {t(
                  'kubevirt-plugin~Default operating system image not available. Define a boot source manually below or rquest your administrator to define one for this operating system via the PVC upload form.',
                )}
              </>
            );
          } else {
            osField.longMessage = t(
              'kubevirt-plugin~The Operating System Template is missing disk image definitions, a custom boot source must be defined manually',
            );
          }
        }

        return osField;
      },
    );
    const baseImage = operatingSystemBaseImages.find((image) => image.id === os);

    const numOfMountedDisks = cloneBaseDiskImage + mountWindowsGuestTools; // using boolean addition operator to count true
    const mountedDisksHelpMsg = numOfMountedDisks > 0 && (
      <Text className="pf-c-form__helper-text kv-create-vm__input-text-help-msg">
        {numOfMountedDisks === 1 ? (
          <Trans t={t} ns="kubevirt-plugin">
            View the mounted disk in the{' '}
            <Button
              isDisabled={!goToStorageStep}
              isInline
              onClick={goToStorageStep}
              variant={ButtonVariant.link}
            >
              <strong>storage</strong>
            </Button>{' '}
            step
          </Trans>
        ) : (
          <Trans t={t} ns="kubevirt-plugin">
            View the mounted disks in the{' '}
            <Button
              isDisabled={!goToStorageStep}
              isInline
              onClick={goToStorageStep}
              variant={ButtonVariant.link}
            >
              <strong>storage</strong>
            </Button>{' '}
            step
          </Trans>
        )}
      </Text>
    );
    const mountedDisksErrorMsg = baseImagesLoadError && (
      <Text className="pf-c-form__helper-text kv-create-vm__input-text-help-msg">
        {t(
          'kubevirt-plugin~Could not access default operating system images. Contact your administrator to gain access to these images. Otherwise provide a manual boot source below.',
        )}
      </Text>
    );

    return (
      <>
        <FormFieldRow
          field={operatinSystemField}
          fieldType={FormFieldType.PF_SELECT}
          validation={operatingSystemValidation}
          loadingResources={loadingResources}
        >
          <FormField value={displayOnly ? display : os}>
            <FormPFSelect
              onSelect={(e, v) =>
                nullOnEmptyChange(onChange, VMSettingsField.OPERATING_SYSTEM)(v.toString())
              }
            >
              {operatingSystemBaseImages.map(({ id, name, message }) => (
                <SelectOption key={id} value={id}>
                  {name || id}
                  {message ? ` ${message}` : ''}
                </SelectOption>
              ))}
            </FormPFSelect>
          </FormField>
          {baseImage && baseImage?.longMessage && (
            <div className="pf-c-form__helper-text" aria-live="polite">
              {baseImage?.longMessage}
            </div>
          )}
        </FormFieldRow>
        <FormFieldRow
          className="kv-create-vm__input-checkbox kv-create-vm__clone-os"
          field={cloneBaseDiskImageField}
          fieldType={FormFieldType.INLINE_CHECKBOX}
          loadingResources={loadingResources}
        >
          <FormField isCreateTemplate={isCreateTemplate}>
            <Checkbox
              id={getFieldId(cloneBaseDiskImageField)}
              onChange={(v) => onChange(VMSettingsField.CLONE_COMMON_BASE_DISK_IMAGE, v)}
              description={baseImage?.checkboxDescription}
            />
            {baseImage?.pvcName && baseImage?.pvcNamespace && (
              <div className="kv-create-vm__clone-os-link">
                (
                <ResourceLink
                  kind={PersistentVolumeClaimModel.kind}
                  name={baseImage.pvcName}
                  namespace={baseImage.pvcNamespace}
                />
                )
              </div>
            )}
          </FormField>
        </FormFieldRow>
        {mountedDisksErrorMsg}
        <FormFieldRow
          field={mountWindowsGuestToolsField}
          fieldType={FormFieldType.INLINE_CHECKBOX}
          loadingResources={loadingResources}
        >
          <FormField>
            <Checkbox
              className="kv-create-vm__input-checkbox"
              id={getFieldId(VMSettingsField.MOUNT_WINDOWS_GUEST_TOOLS)}
              onChange={(v) => onChange(VMSettingsField.MOUNT_WINDOWS_GUEST_TOOLS, v)}
            />
          </FormField>
        </FormFieldRow>
        {mountedDisksHelpMsg}
      </>
    );
  },
);

type OSProps = {
  iUserTemplate: any;
  commonTemplates: any;
  flavor: string;
  commonTemplateName: string;
  operatinSystemField: any;
  cloneBaseDiskImageField: any;
  isCreateTemplate: boolean;
  mountWindowsGuestToolsField: any;
  workloadProfile: string;
  cnvBaseImages: any;
  openshiftFlag: boolean;
  onChange: (key: string, value: string | boolean) => void;
  goToStorageStep: () => void;
};
