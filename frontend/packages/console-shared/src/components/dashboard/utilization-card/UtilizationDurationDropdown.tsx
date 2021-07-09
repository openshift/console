import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from '@console/internal/components/utils';
import { DurationKeys, DURATION_VALUES, useUtilizationDuration } from '@console/shared';

export const UtilizationDurationDropdown: React.FC<UtilizationDurationDropdownProps> = ({
  adjustDuration,
}) => {
  const { t } = useTranslation();
  const { selectedKey, updateSelectedKey, updateDuration } = useUtilizationDuration(adjustDuration);
  const items = {
    [DurationKeys.OneHour]: t('console-shared~1 hour'),
    [DurationKeys.SixHours]: t('console-shared~6 hours'),
    [DurationKeys.TwentyFourHours]: t('console-shared~24 hours'),
  };

  const onChange = React.useCallback(
    (newSelected) => {
      updateSelectedKey(newSelected);
      updateDuration(DURATION_VALUES[newSelected]);
    },
    [updateDuration, updateSelectedKey],
  );

  return (
    <Dropdown
      items={items}
      onChange={onChange}
      selectedKey={selectedKey}
      title={items[selectedKey]}
    />
  );
};

type UtilizationDurationDropdownProps = {
  adjustDuration?: (duration: number) => number;
};
