import type { FC, Ref } from 'react';
import { useState, useCallback } from 'react';
import {
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectOption,
  Skeleton,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Perspective } from '@console/dynamic-plugin-sdk/src/extensions';
import type { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { usePerspectiveExtension, usePerspectives } from '@console/shared/src';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import {
  PREFERRED_PERSPECTIVE_USER_SETTING_KEY,
  usePreferredPerspective,
} from './usePreferredPerspective';

const PreferredPerspectiveSelectOptions: FC<PreferredPerspectiveSelectOptionsProps> = ({
  perspectives,
}) => (
  <>
    {perspectives
      .sort((a, b) => {
        const aName = a?.properties?.name || '';
        const bName = b?.properties?.name || '';
        return aName.localeCompare(bName);
      })
      .map(({ properties }) => (
        <SelectOption
          data-test={`${properties.id} option console.preferredPerspective `}
          key={properties.id}
          value={properties.id}
        >
          {properties.name}
        </SelectOption>
      ))}
  </>
);

const PreferrredPerspectiveSelect: FC = () => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();
  const lastViewed = t('console-app~Last viewed');
  const [isOpen, setIsOpen] = useState(false);
  const [
    preferredPerspectiveID,
    setPreferredPerspectiveID,
    preferredPerspectiveIDLoaded,
  ] = usePreferredPerspective();
  const preferredPerspective = usePerspectiveExtension(preferredPerspectiveID);
  const perspectives = usePerspectives();

  const onToggle = () => setIsOpen((current) => !current);
  const onSelect = useCallback(
    (_, selection) => {
      if (selection !== preferredPerspectiveID) {
        setPreferredPerspectiveID(selection === lastViewed ? null : selection);
        fireTelemetryEvent('User Preference Changed', {
          property: PREFERRED_PERSPECTIVE_USER_SETTING_KEY,
          value: selection,
        });
      }
      setIsOpen(false);
    },
    [fireTelemetryEvent, lastViewed, preferredPerspectiveID, setPreferredPerspectiveID],
  );

  const menuToggle = useCallback(
    (toggleRef: Ref<MenuToggleElement>) => (
      <MenuToggle
        id="console.preferredPerspective"
        data-test="console.preferredPerspective"
        isFullWidth
        onClick={onToggle}
        ref={toggleRef}
      >
        {preferredPerspective?.properties?.name || lastViewed}
      </MenuToggle>
    ),
    [preferredPerspective, lastViewed],
  );

  return preferredPerspectiveIDLoaded ? (
    <Select
      data-test="select console.preferredPerspective"
      isOpen={isOpen}
      onSelect={onSelect}
      onOpenChange={setIsOpen}
      toggle={menuToggle}
    >
      <SelectOption name={lastViewed} value={lastViewed}>
        {lastViewed}
      </SelectOption>
      <PreferredPerspectiveSelectOptions perspectives={perspectives} />
    </Select>
  ) : (
    <Skeleton height="30px" width="100%" data-test="select skeleton console.preferredPerspective" />
  );
};

type PreferredPerspectiveSelectOptionsProps = { perspectives: LoadedExtension<Perspective>[] };

export default PreferrredPerspectiveSelect;
