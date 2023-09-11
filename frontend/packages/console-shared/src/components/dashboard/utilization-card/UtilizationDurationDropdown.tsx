import * as React from 'react';
import {
  Select as SelectDeprecated,
  SelectOption as SelectOptionDeprecated,
  SelectVariant as SelectVariantDeprecated,
} from '@patternfly/react-core/deprecated';
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
      <SelectDeprecated
        variant={SelectVariantDeprecated.single}
        onToggle={(_event, isExpanded: boolean) => setOpen(isExpanded)}
        onSelect={onSelect}
        selections={selectedKey}
        isOpen={isOpen}
        isPlain
      >
        {Object.keys(items).map((key) => (
          <SelectOptionDeprecated key={key} value={key}>
            {items[key]}
          </SelectOptionDeprecated>
        ))}
      </SelectDeprecated>
    </div>
  );
};
