import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { RadioInput } from '@console/internal/components/radio';
import { FormGroup } from '@patternfly/react-core';
import { PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import {
  getAccessModeForProvisioner,
  getAccessModeRadios,
} from '@console/internal/components/storage/shared';

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
    className,
    pvcResource,
    filterByVolumeMode,
    onChange,
    loaded,
    provisioner,
    availableAccessModes = [],
    description,
    ignoreReadOnly,
  } = props;

  const { t } = useTranslation();
  const pvcInitialAccessMode = pvcResource
    ? getPVCAccessModes(pvcResource, 'value')
    : availableAccessModes;
  const volumeMode: string = pvcResource?.spec?.volumeMode;

  const [allowedAccessModes, setAllowedAccessModes] = React.useState<string[]>();
  const [accessMode, setAccessMode] = React.useState<string>();

  const changeAccessMode = React.useCallback(
    (mode: string) => {
      setAccessMode(mode);
      onChange(mode);
    },
    [onChange],
  );

  React.useEffect(() => {
    if (loaded) {
      setAllowedAccessModes(
        getAccessModeForProvisioner(
          provisioner,
          ignoreReadOnly,
          filterByVolumeMode ? volumeMode : null,
        ),
      );
    }
  }, [filterByVolumeMode, ignoreReadOnly, loaded, provisioner, volumeMode]);

  React.useEffect(() => {
    // Make sure the default or already checked radio button value is from any one of allowed the access mode
    if (allowedAccessModes) {
      if (!accessMode && allowedAccessModes.includes(pvcInitialAccessMode[0])) {
        // To view the same access mode value of pvc
        changeAccessMode(pvcInitialAccessMode[0]);
      } else if (!allowedAccessModes.includes(accessMode)) {
        // Old access mode will be disabled
        changeAccessMode(allowedAccessModes[0]);
      }
    }
  }, [accessMode, allowedAccessModes, changeAccessMode, pvcInitialAccessMode]);

  return (
    <FormGroup
      label={t('console-app~Access mode')}
      isRequired
      fieldId="access-mode"
      className={className}
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
              onChange={(event) => changeAccessMode(event.currentTarget.value)}
              inline
              disabled={disabled}
              checked={checked}
              name="accessMode"
            />
          );
        })}
      {allowedAccessModes && allowedAccessModes && description && (
        <p className="help-block" id="access-mode-help">
          {description}
        </p>
      )}
      {(!loaded || !allowedAccessModes) && <div className="skeleton-text" />}
    </FormGroup>
  );
};

type AccessModeSelectorProps = {
  className?: string;
  pvcResource?: PersistentVolumeClaimKind;
  filterByVolumeMode?: boolean;
  onChange: (accessMode: string) => void;
  availableAccessModes?: string[];
  loaded: boolean;
  loadError?: any;
  provisioner: string;
  description?: string;
  ignoreReadOnly?: boolean;
};
