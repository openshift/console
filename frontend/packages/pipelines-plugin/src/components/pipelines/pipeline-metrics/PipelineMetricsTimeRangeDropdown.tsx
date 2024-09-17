import * as React from 'react';
import {
  formatPrometheusDuration,
  parsePrometheusDuration,
} from '@openshift-console/plugin-shared/src/datetime/prometheus';
import {
  Select,
  SelectList,
  SelectOption,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { map } from 'lodash';
import { useTranslation } from 'react-i18next';
import { PipelineMetricsTimeRangeOptions } from './pipeline-metrics-utils';

interface PipelineMetricsTimeRangeDropdownProps {
  timespan: number;
  setTimespan: (t: number) => void;
}

const PipelineMetricsTimeRangeDropdown: React.FC<PipelineMetricsTimeRangeDropdownProps> = ({
  timespan,
  setTimespan,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const toggleIsOpen = React.useCallback(() => setIsOpen((v) => !v), []);
  const setClosed = React.useCallback(() => setIsOpen(false), []);
  const onChange = React.useCallback((v: string) => setTimespan(parsePrometheusDuration(v)), [
    setTimespan,
  ]);
  const { t } = useTranslation();
  const timeRangeOptions = PipelineMetricsTimeRangeOptions();

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle onClick={toggleIsOpen} isExpanded={isOpen} ref={toggleRef}>
      {timeRangeOptions[formatPrometheusDuration(timespan)]}
    </MenuToggle>
  );

  return (
    <div className="form-group">
      <label>{t('pipelines-plugin~Time Range')}</label>
      <div>
        <Select
          isOpen={isOpen}
          toggle={toggle}
          onSelect={(_, value: string) => {
            if (value) {
              onChange(value);
            }
            setClosed();
          }}
          selected={timespan}
          shouldFocusToggleOnSelect
          onOpenChange={(open) => setIsOpen(open)}
        >
          <SelectList>
            {map(timeRangeOptions, (name, key) => (
              <SelectOption
                key={key}
                value={key}
                isSelected={timespan === parsePrometheusDuration(key)}
              >
                {name}
              </SelectOption>
            ))}
          </SelectList>
        </Select>
      </div>
    </div>
  );
};

export default PipelineMetricsTimeRangeDropdown;
