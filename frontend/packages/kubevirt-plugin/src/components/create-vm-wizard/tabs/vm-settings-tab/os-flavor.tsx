import * as _ from 'lodash';
import * as React from 'react';
import {
  FormSelect,
  FormSelectOption,
  Checkbox,
  Text,
  Button,
  ButtonVariant,
} from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { ValidationErrorType, asValidationObject } from '@console/shared/src/utils/validation';
import {
  concatImmutableLists,
  iGet,
  iGetIsLoaded,
  iGetLoadedData,
  immutableListToShallowJS,
} from '../../../../utils/immutable';
import { FormFieldRow } from '../../form/form-field-row';
import { FormField, FormFieldType } from '../../form/form-field';
import { FormSelectPlaceholderOption } from '../../../form/form-select-placeholder-option';
import {
  getFlavors,
  getOperatingSystems,
  getWorkloadProfiles,
} from '../../../../selectors/vm-template/combined-dependent';
import { flavorSort, ignoreCaseSort } from '../../../../utils/sort';
import { pluralize } from '../../../../utils/strings';
import { VMSettingsField } from '../../types';
import { iGetFieldValue } from '../../selectors/immutable/field';
import { getPlaceholder, getFieldId } from '../../utils/renderable-field-utils';
import { nullOnEmptyChange } from '../../utils/utils';
import { operatingSystemsNative } from '../../../../constants/vm-templates/os';
import { OperatingSystemRecord } from '../../../../types';
import { iGetAnnotation } from '../../../../selectors/immutable/common';
import { iGetName, iGetNamespace } from '../../selectors/immutable/selectors';
import { PVC_UPLOAD_URL } from '../../../../constants';
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

export const OSFlavor: React.FC<OSFlavorProps> = React.memo(
  ({
    userTemplates,
    commonTemplates,
    userTemplate,
    operatinSystemField,
    cloneBaseDiskImageField,
    mountWindowsGuestToolsField,
    flavorField,
    workloadProfile,
    cnvBaseImages,
    onChange,
    openshiftFlag,
    goToStorageStep,
  }) => {
    const flavor = iGetFieldValue(flavorField);
    const os = iGetFieldValue(operatinSystemField);
    const display = iGet(operatinSystemField, 'display');
    const displayOnly = !!display;
    const cloneBaseDiskImage = iGetFieldValue(cloneBaseDiskImageField);
    const mountWindowsGuestTools = iGetFieldValue(mountWindowsGuestToolsField);
    const params = {
      userTemplate,
      flavor,
      workload: workloadProfile,
      os,
    };

    const vanillaTemplates = immutableListToShallowJS(
      concatImmutableLists(iGetLoadedData(commonTemplates), iGetLoadedData(userTemplates)),
    );

    let operatingSystems;

    if (displayOnly) {
      operatingSystems = [{ name: display, id: display }];
    } else {
      operatingSystems = openshiftFlag
        ? ignoreCaseSort(getOperatingSystems(vanillaTemplates, params.userTemplate), ['name'])
        : operatingSystemsNative;
    }

    const flavors = flavorSort(getFlavors(vanillaTemplates, params));

    const workloadProfiles = getWorkloadProfiles(vanillaTemplates, params);

    const loadingResources = openshiftFlag
      ? {
          userTemplates,
          commonTemplates,
          cnvBaseImages,
        }
      : {};

    let operatingSystemValidation;
    let flavorValidation;

    if (
      iGetIsLoaded(commonTemplates) &&
      iGetIsLoaded(userTemplates) &&
      (operatingSystems.length === 0 || flavors.length === 0 || workloadProfiles.length === 0)
    ) {
      const validation = asValidationObject(
        'There is no valid template for this combination. Please install required template or select different os/flavor/workload profile combination.',
        ValidationErrorType.Info,
      );
      if (!operatinSystemField.get('validation')) {
        operatingSystemValidation = validation;
      } else if (!flavorField.get('validation')) {
        flavorValidation = validation;
      }
    }

    const loadedBaseImages = iGetLoadedData(cnvBaseImages);
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

        if (!userTemplate) {
          if (baseImageFoundInCluster && pvcName) {
            osField.message = isBaseImageUploading
              ? BASE_IMAGE_AND_PVC_UPLOADING_SHORT
              : BASE_IMAGE_AND_PVC_SHORT;
            osField.longMessage = BASE_IMAGE_AND_PVC_MESSAGE;
            osField.checkboxDescription = isBaseImageUploading ? BASE_IMAGE_UPLOADING_MESSAGE : '';
          } else if (pvcName) {
            osField.message = NO_BASE_IMAGE_SHORT;
            osField.longMessage = (
              <>
                Operating system image not available. You can either{' '}
                <Link to={`${PVC_UPLOAD_URL}?${CDI_UPLOAD_OS_URL_PARAM}=${operatingSystem.id}`}>
                  upload a new disk image
                </Link>{' '}
                or define a boot source manually in the boot source dropdown
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
      <Text className="kv-create-vm__input-text-help-msg">
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

    return (
      <>
        <FormFieldRow
          field={operatinSystemField}
          fieldType={FormFieldType.SELECT}
          validation={operatingSystemValidation}
          loadingResources={loadingResources}
        >
          <FormField value={displayOnly ? display : undefined}>
            <FormSelect onChange={nullOnEmptyChange(onChange, VMSettingsField.OPERATING_SYSTEM)}>
              {!displayOnly && (
                <FormSelectPlaceholderOption
                  placeholder={getPlaceholder(VMSettingsField.OPERATING_SYSTEM)}
                  isDisabled={!!os}
                />
              )}
              {operatingSystemBaseImages.map(({ id, name, message }) => (
                <FormSelectOption key={id} value={id} label={`${name || id} ${message}`} />
              ))}
            </FormSelect>
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
        <FormFieldRow
          field={flavorField}
          fieldType={FormFieldType.SELECT}
          validation={flavorValidation}
          loadingResources={loadingResources}
        >
          <FormField isDisabled={flavor && flavors.length === 1}>
            <FormSelect onChange={nullOnEmptyChange(onChange, VMSettingsField.FLAVOR)}>
              <FormSelectPlaceholderOption
                placeholder={getPlaceholder(VMSettingsField.FLAVOR)}
                isDisabled={!!flavor}
              />
              {flavors.map((f) => {
                return <FormSelectOption key={f} value={f} label={_.capitalize(f)} />;
              })}
            </FormSelect>
          </FormField>
        </FormFieldRow>
      </>
    );
  },
);

type OSFlavorProps = {
  userTemplates: any;
  commonTemplates: any;
  flavorField: any;
  operatinSystemField: any;
  cloneBaseDiskImageField: any;
  mountWindowsGuestToolsField: any;
  userTemplate: string;
  workloadProfile: string;
  cnvBaseImages: any;
  openshiftFlag: boolean;
  onChange: (key: string, value: string | boolean) => void;
  goToStorageStep: () => void;
};
