import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from '@console/internal/components/utils';
import { DurationKeys, DEFAULT_DURATION_KEY, DURATION_VALUES } from '@console/shared';

export const UtilizationDurationDropdown: React.FC<UtilizationDurationDropdownProps> = ({
  onChange,
}) => {
  const { t } = useTranslation();
  const items = {
    [DurationKeys.OneHour]: t('console-shared~1 hour'),
    [DurationKeys.SixHours]: t('console-shared~6 hours'),
    [DurationKeys.TwentyFourHours]: t('console-shared~24 hours'),
  };

  const [selected, setSelected] = React.useState(DEFAULT_DURATION_KEY);
  const handleChange = React.useCallback(
    (newSelected) => {
      setSelected(newSelected);
      onChange(DURATION_VALUES[newSelected]);
    },
    [onChange],
  );
  return (
    <Dropdown
      items={items}
      onChange={handleChange}
      selectedKey={selected}
      title={items[selected]}
    />
  );
};

type UtilizationDurationDropdownProps = {
  onChange: (duration: number) => void;
};
