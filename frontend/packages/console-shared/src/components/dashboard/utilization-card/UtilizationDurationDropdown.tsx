import * as React from 'react';
import { Select, SelectVariant, SelectOption } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { UtilizationDurationDropdownProps } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { DurationKeys, DURATION_VALUES } from '../../../constants/duration';
import { useUtilizationDuration } from '../../../hooks';

export const UtilizationDurationDropdown: React.FC<UtilizationDurationDropdownProps> = ({
  adjustDuration,
}) => {
  const [isOpen, setOpen] = React.useState(false);
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
      setOpen(false);
    },
    [updateDuration, updateSelectedKey],
  );

  return (
    <div data-test-id="duration-select">
      <Select
        variant={SelectVariant.single}
        onToggle={setOpen}
        onSelect={onSelect}
        selections={selectedKey}
        isOpen={isOpen}
        isPlain
      >
        {Object.keys(items).map((key) => (
          <SelectOption key={key} value={key}>
            {items[key]}
          </SelectOption>
        ))}
      </Select>
    </div>
  );
};
