import * as React from 'react';
import { FormGroup, Alert } from '@patternfly/react-core';
import { useField, useFormikContext, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { AccessModeSelector } from '@console/app/src/components/access-modes/access-mode';
import { RadioInput } from '@console/internal/components//radio';
import {
  getVolumeModeRadios,
  initialAccessModes,
  dropdownUnits,
  getAccessModeForProvisioner,
} from '@console/internal/components/storage/shared';
import { RequestSizeInput, ExpandCollapse } from '@console/internal/components/utils';
import { StorageClassDropdown } from '@console/internal/components/utils/storage-class-dropdown';
import { useFormikValidationFix } from '@console/shared/src/hooks';
import { cephStorageProvisioners } from '@console/shared/src/utils';

import './VolumeClaimTemplateForm.scss';

interface VolumeClaimTemplateFormProps {
  name: string;
  initialSizeValue?: string;
  initialSizeUnit?: string;
  initialVolumeMode?: string;
}

interface RequestSize {
  value: string;
  unit: string;
}

const VolumeClaimTemplateForm: React.FC<VolumeClaimTemplateFormProps> = ({
  name,
  initialSizeValue = '1',
  initialSizeUnit = 'Gi',
  initialVolumeMode = 'Filesystem',
}) => {
  const { t } = useTranslation();
  const [field] = useField(name);
  const initAccessModeHelp = t('pipelines-plugin~Permissions to the mounted drive.');
  const [accessModeHelp, setAccessModeHelp] = React.useState(initAccessModeHelp);
  const { setFieldValue, setFieldTouched, errors } = useFormikContext<FormikValues>();
  const [allowedAccessModes, setAllowedAccessModes] = React.useState<string[]>(initialAccessModes);
  const [volumeMode, setVolumeMode] = React.useState(initialVolumeMode);
  const [accessMode, setAccessMode] = React.useState('ReadWriteOnce');
  const [requestSizeError, setRequestSizeError] = React.useState(null);
  const [requestSizeValue, setRequestSizeValue] = React.useState(initialSizeValue);
  const [requestSizeUnit, setRequestSizeUnit] = React.useState(initialSizeUnit);
  const [storageProvisioner, setStorageProvisioner] = React.useState('');
  const [storageClass, setStorageClass] = React.useState('');
  useFormikValidationFix(field.value);

  const handleVolumeMode: React.ReactEventHandler<HTMLInputElement> = (event) => {
    setVolumeMode(event.currentTarget.value);
  };

  const handleStorageClass = (updatedStorageClass): void => {
    const provisioner: string = updatedStorageClass?.provisioner || '';
    // if the provisioner is unknown or no storage class selected, user should be able to set any access mode
    const modes = getAccessModeForProvisioner(provisioner);
    // setting message to display for various modes when a storage class of a know provisioner is selected
    const displayMessage = modes
      ? t('pipelines-plugin~Access mode is set by storage class and cannot be changed')
      : t('pipelines-plugin~Permissions to the mounted drive');
    setAccessMode('ReadWriteOnce');
    setAccessModeHelp(displayMessage);
    // setting accessMode to default with the change to Storage Class selection
    setAllowedAccessModes(modes);
    setStorageClass(updatedStorageClass?.metadata?.name);
    setStorageProvisioner(provisioner);
    if (storageProvisioner.includes(cephStorageProvisioners[1])) {
      setVolumeMode('Filesystem');
    }
  };

  const handleRequestSizeChange = (size: RequestSize): void => {
    const { value, unit } = size;
    setRequestSizeValue(value);
    setRequestSizeUnit(unit);
  };

  React.useEffect(() => {
    setRequestSizeError(null);
    const volumeClaimTemplate = {
      spec: {
        accessModes: [accessMode],
        storageClassName: storageClass,
        volumeMode,
        resources: {
          requests: { storage: `${requestSizeValue}${requestSizeUnit}` },
        },
      },
    };
    if (!requestSizeValue || parseInt(requestSizeValue, 10) < 1) {
      volumeClaimTemplate.spec.resources.requests.storage = null;
      setRequestSizeError(t('pipelines-plugin~Size must be an integer greater than 0.'));
    }

    setFieldValue(name, volumeClaimTemplate);
    setFieldTouched(name);
  }, [
    volumeMode,
    accessMode,
    requestSizeValue,
    requestSizeUnit,
    storageClass,
    name,
    setFieldTouched,
    setFieldValue,
    t,
  ]);

  const helpText = !requestSizeError
    ? t(
        'pipelines-plugin~This will create a PersistentVolumeClaim with a size of {{requestSizeValue}} {{requestSizeUnit}}.',
        { requestSizeValue, requestSizeUnit },
      )
    : t('pipelines-plugin~This will create a PersistentVolumeClaim.');

  return (
    <FormGroup fieldId={name}>
      {errors[name] && <Alert isInline variant="danger" title={t('pipelines-plugin~Required')} />}
      <p className="help-block">{helpText}</p>
      <ExpandCollapse
        textExpanded={t('pipelines-plugin~Hide VolumeClaimTemplate options')}
        textCollapsed={t('pipelines-plugin~Show VolumeClaimTemplate options')}
      >
        <div className="odc-VolumeClaimTemplateForm--section">
          <StorageClassDropdown
            onChange={handleStorageClass}
            id="storageclass-dropdown"
            data-test="storageclass-dropdown"
            describedBy="storageclass-dropdown-help"
            required={false}
            name="storageClass"
          />
        </div>
        <div className="odc-VolumeClaimTemplateForm--section">
          <AccessModeSelector
            onChange={setAccessMode}
            provisioner={storageProvisioner}
            loaded
            availableAccessModes={allowedAccessModes}
            description={accessModeHelp}
            ignoreReadOnly
          />
        </div>
        <div className="odc-VolumeClaimTemplateForm--section">
          <label className="control-label co-required" htmlFor="request-size-input">
            {t('pipelines-plugin~Size')}
          </label>
          <RequestSizeInput
            name="requestSize"
            required
            onChange={handleRequestSizeChange}
            defaultRequestSizeUnit={requestSizeUnit}
            defaultRequestSizeValue={requestSizeValue}
            dropdownUnits={dropdownUnits}
            describedBy="request-size-help"
            inputID="request-size-input"
            data-test-id="pvc-size-input"
          />
          {requestSizeError ? (
            <p className="pf-v5-c-form__helper-text pf-m-error">{requestSizeError}</p>
          ) : (
            <p className="help-block">{t('pipelines-plugin~Desired storage capacity')}</p>
          )}
        </div>
        <div className="odc-VolumeClaimTemplateForm--section">
          <label className="control-label" htmlFor="volume-mode">
            {t('pipelines-plugin~Volume Mode')}
          </label>
          <FormGroup fieldId="volumeMode" data-test-id="volumeModeRadio">
            {getVolumeModeRadios().map((radio) => (
              <RadioInput
                {...radio}
                key={radio.value}
                onChange={handleVolumeMode}
                inline
                checked={radio.value === volumeMode}
                name={`${name}.volumeMode`}
              />
            ))}
          </FormGroup>
        </div>
      </ExpandCollapse>
    </FormGroup>
  );
};

export default VolumeClaimTemplateForm;
