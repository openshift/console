import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import { DeploymentModel, StatefulSetModel, DaemonSetModel } from '@console/internal/models';
import { Firehose } from '@console/internal/components/utils';
import { ResourceDropdown } from '@console/shared';

export enum OptionTypes {
  selectAll = '#SELECT_ALL_WORKLOADS#',
}
export const OptionValues = {
  [OptionTypes.selectAll]: 'All Workloads',
};
type MonitoringWorkloadFilterProps = {
  namespace: string;
  name: string;
  onChange: (key: string, type: string) => void;
};
export const MonitoringWorkloadFilter: React.FC<MonitoringWorkloadFilterProps> = React.memo(
  ({ namespace, name, onChange }) => {
    const selectedTaskRef = React.useRef<string>(name);
    selectedTaskRef.current = name;

    const resourcesDefs = [
      { isList: true, namespace, kind: DeploymentModel.kind, prop: DeploymentModel.id },
      { isList: true, namespace, kind: DaemonSetModel.kind, prop: DaemonSetModel.id },
      { isList: true, namespace, kind: StatefulSetModel.kind, prop: StatefulSetModel.id },
    ];
    const onSelect = (key: string, ele: React.ReactElement) => {
      if (selectedTaskRef.current !== key) {
        selectedTaskRef.current = key;
        onChange && onChange(key, ele?.props.model.id);
      }
    };
    return (
      <Firehose resources={resourcesDefs}>
        <ResourceDropdown
          id="odc-monitoring-dashboard-workload-filter"
          dataSelector={['metadata', 'name']}
          selectedKey={selectedTaskRef.current}
          placeholder="Filter by workload"
          dropDownClassName={'odc-monitoring-dashboard__workload-filter dropdown--full-width'}
          onChange={onSelect}
          showBadge
          autoSelect
          autocompleteFilter={(strText, item: React.ReactElement): boolean =>
            fuzzy(strText, item?.props?.name)
          }
          actionItems={[
            {
              actionTitle: OptionValues[OptionTypes.selectAll],
              actionKey: OptionTypes.selectAll,
            },
          ]}
        />
      </Firehose>
    );
  },
);
