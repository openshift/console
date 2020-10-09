import * as React from 'react';
import { RadioInput } from '@console/internal/components/radio';
import { FormGroup } from '@patternfly/react-core';
import {
  provisionerAccessModeMapping,
  getAccessModeForProvisioner,
  cephRBDProvisionerSuffix,
  accessModeRadios,
} from '@console/internal/components/storage/shared';
import { PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import * as _ from 'lodash';

export const getPVCAccessModes = (resource: PersistentVolumeClaimKind, key: string) =>
  _.reduce(
    resource?.spec?.accessModes,
    (res, value) => {
      const mode = accessModeRadios.find((accessMode) => accessMode.value === value);
      if (mode) {
        res.push(mode[key]);
      }
      return res;
    },
    [],
  );

export const AccessModeSelector: React.FC<AccessModeSelectorProps> = (props) => {
  const { formClassName, pvcResource, onChange, loadError, loaded, provisioner } = props;

  const pvcInitialAccessMode = pvcResource ? getPVCAccessModes(pvcResource, 'value') : '';

  const [allowedAccessModes, setAllowedAccessModes] = React.useState<string[]>();
  const [accessMode, setAccessMode] = React.useState(pvcInitialAccessMode);

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

  const onAccessModeChange: React.ReactEventHandler<HTMLInputElement> = (event) => {
    setAccessMode(event.currentTarget.value);
    onChange(event.currentTarget.value);
  };

  return (
    <FormGroup label="Access Mode" isRequired fieldId="access-mode" className={formClassName}>
      {loaded &&
        allowedAccessModes &&
        accessModeRadios.map((radio) => {
          let radioObj = null;
          const disabled = !allowedAccessModes.includes(radio.value);
          allowedAccessModes.forEach((mode) => {
            const checked =
              !disabled && !loadError ? radio.value === accessMode[0] : radio.value === mode;
            radioObj = (
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
          });
          return radioObj;
        })}
      {(!loaded || !allowedAccessModes) && <div className="skeleton-text" />}
    </FormGroup>
  );
};

type AccessModeSelectorProps = {
  formClassName?: string;
  pvcResource?: PersistentVolumeClaimKind;
  onChange: Function;
  loaded: boolean;
  loadError: any;
  provisioner: string;
};
