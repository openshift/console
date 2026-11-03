import type { FC, Ref, CSSProperties } from 'react';
import { useState, useEffect, useRef } from 'react';
import type { MenuToggleElement } from '@patternfly/react-core';
import { FormGroup, Select, SelectOption, SelectList, MenuToggle } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  getAccessModeForProvisioner,
  getAccessModeOptions,
} from '@console/internal/components/storage/shared';
import type { PersistentVolumeClaimKind } from '@console/internal/module/k8s';

export const getPVCAccessModes = (resource: PersistentVolumeClaimKind, key: string) =>
  _.reduce(
    resource?.spec?.accessModes,
    (res: any[], value) => {
      const mode = getAccessModeOptions().find((accessMode) => accessMode.value === value);
      if (mode) {
        res.push(mode[key]);
      }
      return res;
    },
    [] as any[],
  );

export const AccessModeSelector: FC<AccessModeSelectorProps> = (props) => {
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

  const { t } = useTranslation('console-app');
  const pvcInitialAccessMode = pvcResource
    ? getPVCAccessModes(pvcResource, 'value')
    : availableAccessModes;
  const volumeMode: string = pvcResource?.spec?.volumeMode ?? '';

  const allowedAccessModes: string[] | undefined = loaded
    ? getAccessModeForProvisioner(
        provisioner,
        ignoreReadOnly,
        filterByVolumeMode ? volumeMode : undefined,
      )
    : undefined;

  const [accessMode, setAccessMode] = useState<string>();

  if (allowedAccessModes) {
    if (!accessMode && allowedAccessModes.includes(pvcInitialAccessMode[0])) {
      // To view the same access mode value of pvc
      setAccessMode(pvcInitialAccessMode[0]);
    } else if (
      accessMode !== allowedAccessModes[0] &&
      !allowedAccessModes.includes(accessMode ?? '')
    ) {
      // Old access mode will be disabled
      setAccessMode(allowedAccessModes[0]);
    }
  }

  // Notify the parent after commit: the parent form cannot be updated while
  // this component renders. Only a selection change notifies, not an
  // onChange identity change.
  const lastNotifiedModeRef = useRef<string>();
  useEffect(() => {
    if (accessMode && accessMode !== lastNotifiedModeRef.current) {
      onChange(accessMode);
      lastNotifiedModeRef.current = accessMode;
    }
  }, [accessMode, onChange]);

  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string>(
    getAccessModeOptions().find((mode) => mode.value === pvcInitialAccessMode[0])?.title ?? '',
  );

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = (_event: undefined, value: { val: string; label: string }) => {
    setIsOpen(!isOpen);
    setSelected(value.label);
    setAccessMode(value.val);
  };
  const selectOptions = getAccessModeOptions().map((option) => {
    const disabled = !allowedAccessModes?.includes(option.value);
    return (
      <SelectOption
        key={option.title}
        value={{ val: option.value, label: option.title }}
        isDisabled={disabled}
        isSelected={accessMode === option.value}
      >
        {option.title}
      </SelectOption>
    );
  });

  const toggle = (toggleRef: Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={onToggleClick}
      isExpanded={isOpen}
      style={
        {
          width: '200px',
        } as CSSProperties
      }
    >
      {selected}
    </MenuToggle>
  );

  return (
    <FormGroup label={t('Access mode')} isRequired fieldId="access-mode" className={className}>
      {loaded && allowedAccessModes && (
        <Select
          isOpen={isOpen}
          selected={selected}
          onSelect={onSelect}
          onOpenChange={(open) => setIsOpen(open)}
          toggle={toggle}
          shouldFocusToggleOnSelect
        >
          <SelectList>{selectOptions}</SelectList>
        </Select>
      )}

      {allowedAccessModes && allowedAccessModes && description && (
        <p className="help-block" id="access-mode-help">
          {description}
        </p>
      )}
      {(!loaded || !allowedAccessModes) && (
        <div className="skeleton-text" role="status" aria-busy="true" />
      )}
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
