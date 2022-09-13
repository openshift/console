import * as React from 'react';
import {
  formatPrometheusDuration,
  parsePrometheusDuration,
} from '@openshift-console/plugin-shared/src/datetime/prometheus';
import { Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core';
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
  const [isOpen, setValue] = React.useState(false);
  const toggleIsOpen = React.useCallback(() => setValue((v) => !v), []);
  const setClosed = React.useCallback(() => setValue(false), []);
  const onChange = React.useCallback((v: string) => setTimespan(parsePrometheusDuration(v)), [
    setTimespan,
  ]);
  const { t } = useTranslation();
  const timeRangeOptions = PipelineMetricsTimeRangeOptions();
  return (
    <div className="form-group">
      <label>{t('pipelines-plugin~Time Range')}</label>
      <div>
        <Dropdown
          dropdownItems={map(timeRangeOptions, (name, key) => (
            <DropdownItem
              component="button"
              key={key}
              onClick={() => {
                onChange(key);
                setClosed();
              }}
            >
              {name}
            </DropdownItem>
          ))}
          isOpen={isOpen}
          toggle={
            <DropdownToggle onToggle={toggleIsOpen}>
              {timeRangeOptions[formatPrometheusDuration(timespan)]}
            </DropdownToggle>
          }
        />
      </div>
    </div>
  );
};

export default PipelineMetricsTimeRangeDropdown;
