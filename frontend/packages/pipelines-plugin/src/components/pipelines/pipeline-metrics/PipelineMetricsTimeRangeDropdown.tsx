import * as React from 'react';
import {
  formatPrometheusDuration,
  parsePrometheusDuration,
} from '@openshift-console/plugin-shared/src/datetime/prometheus';
import {
  Dropdown as DropdownDeprecated,
  DropdownItem as DropdownItemDeprecated,
  DropdownToggle as DropdownToggleDeprecated,
} from '@patternfly/react-core/deprecated';
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
        <DropdownDeprecated
          dropdownItems={map(timeRangeOptions, (name, key) => (
            <DropdownItemDeprecated
              component="button"
              key={key}
              onClick={() => {
                onChange(key);
                setClosed();
              }}
            >
              {name}
            </DropdownItemDeprecated>
          ))}
          isOpen={isOpen}
          toggle={
            <DropdownToggleDeprecated onToggle={toggleIsOpen}>
              {timeRangeOptions[formatPrometheusDuration(timespan)]}
            </DropdownToggleDeprecated>
          }
        />
      </div>
    </div>
  );
};

export default PipelineMetricsTimeRangeDropdown;
