import type { FC } from 'react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { FormGroup, Radio } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import { useTranslation, Trans } from 'react-i18next';
import {
  getVolumeModeRadios,
  getVolumeModeForProvisioner,
  initialVolumeModes,
} from '@console/internal/components/storage/shared';
import { FieldLevelHelp } from '@console/internal/components/utils/field-level-help';
import type { PersistentVolumeClaimKind } from '@console/internal/module/k8s';

export const VolumeModeSelector: FC<VolumeModeSelectorProps> = (props) => {
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
    ? pvcResource?.spec?.volumeMode || ''
    : availableVolumeMode || initialVolumeModes[0];

  const [volumeMode, setVolumeMode] = useState<string>();
  const allowedVolumeModes: string[] = useMemo(
    () => (loaded ? getVolumeModeForProvisioner(provisioner, accessMode) : []),
    [loaded, provisioner, accessMode],
  );

  const changeVolumeMode = useCallback(
    (mode: string) => {
      setVolumeMode(mode);
      onChange(mode);
    },
    [onChange],
  );

  useEffect(() => {
    if (!allowedVolumeModes.length) {
      return;
    }
    // Make sure the default or already checked radio button value is from any one of allowed the access mode
    if (!volumeMode && allowedVolumeModes.includes(pvcInitialVolumeMode)) {
      // To view the same volume mode value of pvc
      changeVolumeMode(pvcInitialVolumeMode);
    } else if (!allowedVolumeModes.includes(volumeMode || '')) {
      // Old volume mode will be disabled
      changeVolumeMode(allowedVolumeModes[0]);
    }
  }, [volumeMode, allowedVolumeModes, onChange, pvcInitialVolumeMode, changeVolumeMode]);

  return (
    <FormGroup
      role="radiogroup"
      isInline
      fieldId="volume-mode"
      label={t('console-app~Volume mode')}
      isRequired
      className={css(className, 'pf-v6-c-form__group-control--no-row-gap')}
    >
      {allowedVolumeModes.length === 1 ? (
        <>
          {allowedVolumeModes[0]}
          <FieldLevelHelp>
            <Trans t={t} ns="console-app">
              Only {{ volumeMode }} volume mode is available for {{ storageClass }} with{' '}
              {{ accessMode }} access mode
            </Trans>
          </FieldLevelHelp>
        </>
      ) : (
        getVolumeModeRadios().map((radio) => {
          const checked = radio.value === volumeMode;
          return (
            <Radio
              key={radio.value}
              id={`volumeMode-${radio.value}`}
              name="volumeMode"
              {...radio}
              onChange={(event) => changeVolumeMode(event.currentTarget.value)}
              isChecked={checked}
              data-checked-state={checked}
              isDisabled={!allowedVolumeModes.includes(radio.value)}
            />
          );
        })
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
