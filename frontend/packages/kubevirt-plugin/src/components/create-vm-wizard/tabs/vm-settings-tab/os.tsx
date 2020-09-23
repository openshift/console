import * as React from 'react';
import { Checkbox, Text, Button, ButtonVariant, SelectOption } from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { ValidationErrorType, asValidationObject } from '@console/shared/src/utils/validation';
import {
  iGet,
  iGetIsLoaded,
  iGetLoadedData,
  immutableListToShallowJS,
  iGetLoadError,
  toShallowJS,
} from '../../../../utils/immutable';
import { FormFieldRow } from '../../form/form-field-row';
import { FormField, FormFieldType } from '../../form/form-field';
import {
  getFlavors,
  getWorkloadProfiles,
} from '../../../../selectors/vm-template/combined-dependent';
import { flavorSort, ignoreCaseSort } from '../../../../utils/sort';
import { pluralize } from '../../../../utils/strings';
import { VMSettingsField } from '../../types';
import { iGetFieldValue } from '../../selectors/immutable/field';
import { getFieldId } from '../../utils/renderable-field-utils';
import { nullOnEmptyChange } from '../../utils/utils';
import { operatingSystemsNative } from '../../../../constants/vm-templates/os';
import { OperatingSystemRecord } from '../../../../types';
import { iGetAnnotation } from '../../../../selectors/immutable/common';
import { iGetName, iGetNamespace } from '../../selectors/immutable/selectors';
import { getPVCUploadURL } from '../../../../constants';
import {
  BASE_IMAGE_AND_PVC_SHORT,
  BASE_IMAGE_AND_PVC_MESSAGE,
  NO_BASE_IMAGE_SHORT,
  NO_BASE_IMAGE_AND_NO_PVC_MESSAGE,
  NO_BASE_IMAGE_AND_NO_PVC_SHORT,
  BASE_IMAGE_AND_PVC_UPLOADING_SHORT,
  BASE_IMAGE_UPLOADING_MESSAGE,
} from '../../strings/strings';
import {
  CDI_UPLOAD_OS_URL_PARAM,
  CDI_UPLOAD_POD_ANNOTATION,
  CDI_UPLOAD_RUNNING,
} from '../../../cdi-upload-provider/consts';
import { getTemplateOperatingSystems } from '../../../../selectors/vm-template/advanced';
import { FormPFSelect } from '../../../form/form-pf-select';
import { useAccessReview } from '@console/internal/components/utils';
import { PersistentVolumeClaimModel } from '@console/internal/models';

export const OS: React.FC<OSProps> = React.memo(
  ({
    iUserTemplate,
    commonTemplates,
    operatinSystemField,
    cloneBaseDiskImageField,
    mountWindowsGuestToolsField,
    flavor,
    workloadProfile,
    cnvBaseImages,
    onChange,
    openshiftFlag,
    goToStorageStep,
  }) => {
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

    const loadingResources = openshiftFlag
      ? {
          commonTemplates,
        }
      : {};

    if (openshiftFlag && iUserTemplate) {
      Object.assign(loadingResources, { iUserTemplate });
    }

    let operatingSystemValidation;

    if (
      iGetIsLoaded(commonTemplates) &&
      (!iUserTemplate || isUserTemplateValid) &&
      (operatingSystems.length === 0 || flavors.length === 0 || workloadProfiles.length === 0)
    ) {
      const validation = asValidationObject(
        'There is no valid template for this combination. Please install required template or select different os/flavor/workload profile combination.',
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
        const pvcName = operatingSystem?.dataVolumeName;
        const pvcNamespace = operatingSystem?.dataVolumeNamespace;
        const baseImageFoundInCluster = loadedBaseImages?.find(
          (pvc) => iGetName(pvc) === pvcName && iGetNamespace(pvc) === pvcNamespace,
        );
        const isBaseImageUploading =
          iGetAnnotation(baseImageFoundInCluster, CDI_UPLOAD_POD_ANNOTATION) === CDI_UPLOAD_RUNNING;
        const osField: any = {
          id: operatingSystem.id,
          name: operatingSystem.name,
          pvcName,
          baseImageFoundInCluster,
          message: '',
          longMessage: '',
          checkboxDescription: '',
        };

        if (!iUserTemplate && !baseImagesLoadError) {
          if (baseImageFoundInCluster && pvcName && pvcNamespace) {
            osField.message = isBaseImageUploading
              ? BASE_IMAGE_AND_PVC_UPLOADING_SHORT
              : BASE_IMAGE_AND_PVC_SHORT;
            osField.longMessage = BASE_IMAGE_AND_PVC_MESSAGE;
            osField.checkboxDescription = isBaseImageUploading ? BASE_IMAGE_UPLOADING_MESSAGE : '';
          } else if (pvcName && pvcNamespace) {
            osField.message = NO_BASE_IMAGE_SHORT;
            osField.longMessage = canUploadGoldenImage ? (
              <>
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
              </>
            ) : (
              <>
                Default operating system image not available. Define a boot source manually below or
                request your administrator to define one for this operating system via the PVC
                upload form.
              </>
            );
          } else {
            osField.message = NO_BASE_IMAGE_AND_NO_PVC_SHORT;
            osField.longMessage = NO_BASE_IMAGE_AND_NO_PVC_MESSAGE;
          }
        }

        return osField;
      },
    );
    const baseImage = operatingSystemBaseImages.find((image) => image.id === os);

    const numOfMountedDisks = cloneBaseDiskImage + mountWindowsGuestTools; // using boolean addition operator to count true
    const mountedDisksHelpMsg = numOfMountedDisks > 0 && (
      <Text className="pf-c-form__helper-text kv-create-vm__input-text-help-msg">
        View the mounted {pluralize(numOfMountedDisks, 'disk')} in the{' '}
        <Button
          isDisabled={!goToStorageStep}
          isInline
          onClick={goToStorageStep}
          variant={ButtonVariant.link}
        >
          <strong>storage</strong>
        </Button>{' '}
        step
      </Text>
    );
    const mountedDisksErrorMsg = baseImagesLoadError && (
      <Text className="pf-c-form__helper-text kv-create-vm__input-text-help-msg">
        Could not access default operating system images. Contact your administrator to gain access
        to these images. Otherwise provide a manual boot source below.
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
          className="kv-create-vm__input-checkbox"
          field={cloneBaseDiskImageField}
          fieldType={FormFieldType.INLINE_CHECKBOX}
          loadingResources={loadingResources}
        >
          <FormField>
            <Checkbox
              id={getFieldId(cloneBaseDiskImageField)}
              onChange={(v) => onChange(VMSettingsField.CLONE_COMMON_BASE_DISK_IMAGE, v)}
              description={baseImage?.checkboxDescription}
            />
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
  operatinSystemField: any;
  cloneBaseDiskImageField: any;
  mountWindowsGuestToolsField: any;
  workloadProfile: string;
  cnvBaseImages: any;
  openshiftFlag: boolean;
  onChange: (key: string, value: string | boolean) => void;
  goToStorageStep: () => void;
};
