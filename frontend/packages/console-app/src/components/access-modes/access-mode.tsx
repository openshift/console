import * as React from 'react';
import { RadioInput } from '@console/internal/components/radio';
import { FormGroup } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  provisionerAccessModeMapping,
  getAccessModeForProvisioner,
  cephRBDProvisionerSuffix,
  getAccessModeRadios,
} from '@console/internal/components/storage/shared';
import { PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import * as _ from 'lodash';

export const getPVCAccessModes = (resource: PersistentVolumeClaimKind, key: string) =>
  _.reduce(
    resource?.spec?.accessModes,
    (res, value) => {
      const mode = getAccessModeRadios().find((accessMode) => accessMode.value === value);
      if (mode) {
        res.push(mode[key]);
      }
      return res;
    },
    [],
  );

export const AccessModeSelector: React.FC<AccessModeSelectorProps> = (props) => {
  const {
    formClassName,
    pvcResource,
    onChange,
    loaded,
    provisioner,
    availableAccessModes = [],
  } = props;

  const { t } = useTranslation();

  const pvcInitialAccessMode = pvcResource
    ? getPVCAccessModes(pvcResource, 'value')
    : availableAccessModes;

  const [allowedAccessModes, setAllowedAccessModes] = React.useState<string[]>();
  const [accessMode, setAccessMode] = React.useState<string>('');

  const updateAllowedAccessModes = (scProvisioner: string) =>
    provisionerAccessModeMapping[scProvisioner] ?? getAccessModeForProvisioner('');

  React.useEffect(() => {
    if (loaded) {
      let currentModes: string[];
      provisioner?.includes(cephRBDProvisionerSuffix) && pvcResource?.spec.volumeMode !== 'Block'
        ? (currentModes = ['ReadWriteOnce', 'ReadOnlyMany'])
        : (currentModes = updateAllowedAccessModes(provisioner));
      setAllowedAccessModes(currentModes);
    }
  }, [loaded, provisioner, pvcResource]);

  React.useEffect(() => {
    // Makesure the default or already checked radio button value is from any one of allowed the access mode
    if (allowedAccessModes) {
      if (accessMode === '' && allowedAccessModes.includes(pvcInitialAccessMode[0])) {
        // To view the same access mode value of pvc
        setAccessMode(pvcInitialAccessMode[0]);
        onChange(pvcInitialAccessMode[0]);
      } else if (!allowedAccessModes.includes(accessMode)) {
        // Old access mode will be disabled
        setAccessMode(allowedAccessModes[0]);
        onChange(allowedAccessModes[0]);
      }
    }
  }, [accessMode, allowedAccessModes, onChange, pvcInitialAccessMode]);

  const onAccessModeChange: React.ReactEventHandler<HTMLInputElement> = (event) => {
    setAccessMode(event.currentTarget.value);
    onChange(event.currentTarget.value);
  };

  return (
    <FormGroup
      label={t('console-app~Access Mode')}
      isRequired
      fieldId="access-mode"
      className={formClassName}
    >
      {loaded &&
        allowedAccessModes &&
        getAccessModeRadios().map((radio) => {
          const disabled = !allowedAccessModes.includes(radio.value);
          const checked = radio.value === accessMode;
          return (
            <RadioInput
              {...radio}
              key={radio.value}
              onChange={onAccessModeChange}
              inline
              disabled={disabled}
              checked={checked}
              name="accessMode"
            />
          );
        })}
      {(!loaded || !allowedAccessModes) && <div className="skeleton-text" />}
    </FormGroup>
  );
};

type AccessModeSelectorProps = {
  formClassName?: string;
  pvcResource?: PersistentVolumeClaimKind;
  onChange: Function;
  availableAccessModes?: string[];
  loaded: boolean;
  loadError: any;
  provisioner: string;
};
