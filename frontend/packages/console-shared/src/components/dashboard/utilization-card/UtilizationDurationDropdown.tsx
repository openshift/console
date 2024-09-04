import * as React from 'react';
import {
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { UtilizationDurationDropdownProps } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { DurationKeys, DURATION_VALUES } from '../../../constants/duration';
import { useUtilizationDuration } from '../../../hooks';

export const UtilizationDurationDropdown: React.FC<UtilizationDurationDropdownProps> = ({
  adjustDuration,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { t } = useTranslation();
  const { selectedKey, updateSelectedKey, updateDuration } = useUtilizationDuration(adjustDuration);
  const items = {
    [DurationKeys.OneHour]: t('console-shared~1 hour'),
    [DurationKeys.SixHours]: t('console-shared~6 hours'),
    [DurationKeys.TwentyFourHours]: t('console-shared~24 hours'),
  };

  const onSelect = React.useCallback(
    (event, newSelected) => {
      updateSelectedKey(newSelected);
      updateDuration(DURATION_VALUES[newSelected]);
      setIsOpen(false);
    },
    [updateDuration, updateSelectedKey],
  );

  return (
    <div data-test-id="duration-select">
      <Select
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            onClick={(open) => setIsOpen(open)}
            isExpanded={isOpen}
            variant="plainText"
          >
            {items[selectedKey]}
          </MenuToggle>
        )}
        onSelect={onSelect}
        selected={selectedKey}
        onOpenChange={(open) => setIsOpen(open)}
        isOpen={isOpen}
      >
        <SelectList>
          {Object.keys(items).map((key) => (
            <SelectOption key={key} value={key}>
              {items[key]}
            </SelectOption>
          ))}
        </SelectList>
      </Select>
    </div>
  );
};
