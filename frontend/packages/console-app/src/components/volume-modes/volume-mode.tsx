import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import { RadioInput } from '@console/internal/components/radio';
import {
  getVolumeModeRadios,
  getVolumeModeForProvisioner,
  initialVolumeModes,
} from '@console/internal/components/storage/shared';
import { FieldLevelHelp } from '@console/internal/components/utils';
import { PersistentVolumeClaimKind } from '@console/internal/module/k8s';

export const VolumeModeSelector: React.FC<VolumeModeSelectorProps> = (props) => {
  const {
    className,
    pvcResource,
    accessMode,
    onChange,
    provisioner,
    storageClass,
    availableVolumeMode,
    loaded,
  } = props;

  const { t } = useTranslation();
  const pvcInitialVolumeMode: string = pvcResource
    ? pvcResource?.spec?.volumeMode
    : availableVolumeMode ?? initialVolumeModes[0];

  const [volumeMode, setVolumeMode] = React.useState<string>();
  const allowedVolumeModes: string[] = React.useMemo(
    () => (loaded ? getVolumeModeForProvisioner(provisioner, accessMode) : []),
    [loaded, provisioner, accessMode],
  );

  const changeVolumeMode = React.useCallback(
    (mode: string) => {
      setVolumeMode(mode);
      onChange(mode);
    },
    [onChange],
  );

  React.useEffect(() => {
    if (!allowedVolumeModes.length) {
      return;
    }
    // Make sure the default or already checked radio button value is from any one of allowed the access mode
    if (!volumeMode && allowedVolumeModes.includes(pvcInitialVolumeMode)) {
      // To view the same volume mode value of pvc
      changeVolumeMode(pvcInitialVolumeMode);
    } else if (!allowedVolumeModes.includes(volumeMode)) {
      // Old volume mode will be disabled
      changeVolumeMode(allowedVolumeModes[0]);
    }
  }, [volumeMode, allowedVolumeModes, onChange, pvcInitialVolumeMode, changeVolumeMode]);

  return (
    <FormGroup
      fieldId="volume-mode"
      className={className}
      label={t('console-app~Volume mode')}
      isRequired
    >
      {allowedVolumeModes.length === 1 ? (
        <>
          {allowedVolumeModes[0]}
          <FieldLevelHelp>
            <Trans t={t} ns="console-app">
              Only {volumeMode} volume mode is available for {storageClass} with {accessMode} access
              mode
            </Trans>
          </FieldLevelHelp>
        </>
      ) : (
        getVolumeModeRadios().map((radio) => (
          <RadioInput
            {...radio}
            key={radio.value}
            onChange={(event) => changeVolumeMode(event.currentTarget.value)}
            inline
            checked={radio.value === volumeMode}
            name="volumeMode"
            disabled={!allowedVolumeModes.includes(radio.value)}
          />
        ))
      )}
    </FormGroup>
  );
};

type VolumeModeSelectorProps = {
  className?: string;
  pvcResource?: PersistentVolumeClaimKind;
  accessMode: string;
  onChange: (volumeMode: string) => void;
  provisioner: string;
  storageClass: string;
  availableVolumeMode?: string;
  loaded: boolean;
};
