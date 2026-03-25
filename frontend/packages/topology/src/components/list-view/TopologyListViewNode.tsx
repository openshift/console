import type { FC } from 'react';
import {
  Button,
  DataList,
  DataListCell,
  DataListContent,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  Tooltip,
  TooltipPosition,
} from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import { observer } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import type { TopologyListViewNodeProps } from '@console/dynamic-plugin-sdk/src/extensions/topology-types';
import { selectOverviewDetailsTab } from '@console/internal/actions/ui';
import { modelFor } from '@console/internal/module/k8s';
import {
  getSeverityAlertType,
  AlertSeverityIcon,
  getFiringAlerts,
  shouldHideMonitoringAlertDecorator,
} from '@console/shared';
import { useSearchFilter } from '../../filters';
import { getResource, getResourceKind } from '../../utils/topology-utils';
import {
  AlertsCell,
  GroupResourcesCell,
  CpuCell,
  MemoryCell,
  StatusCell,
  TypedResourceBadgeCell,
} from './cells';

type DispatchProps = {
  onSelectTab?: (name: string) => void;
};

const TopologyListViewNode: FC<TopologyListViewNodeProps & DispatchProps> = ({
  item,
  selectedIds,
  onSelect,
  onSelectTab,
  badgeCell,
  labelCell,
  alertsCell,
  memoryCell,
  cpuCell,
  statusCell,
  groupResourcesCell,
  hideAlerts = false,
  noPods = false,
  children,
}) => {
  const { t } = useTranslation();
  const [filtered] = useSearchFilter(item.getLabel(), getResource(item)?.metadata?.labels);
  if (!item.isVisible) {
    return null;
  }
  const kind = getResourceKind(item);

  let alertIndicator = null;
  const alerts = getFiringAlerts(item.getData().data?.monitoringAlerts ?? []);
  if (alerts?.length > 0) {
    const onAlertClick = () => {
      onSelect([item.getId()]);
      onSelectTab('Observe');
    };
    const severityAlertType = getSeverityAlertType(alerts);
    alertIndicator = shouldHideMonitoringAlertDecorator(severityAlertType) ? null : (
      <Tooltip
        key="monitoringAlert"
        content={t('topology~Monitoring alert')}
        position={TooltipPosition.right}
      >
        <Button
          icon={<AlertSeverityIcon severityAlertType={severityAlertType} />}
          variant="plain"
          className="odc-topology-list-view__alert-button"
          onClick={onAlertClick}
        />
      </Tooltip>
    );
  }

  const cells = [];
  cells.push(
    labelCell || (
      <DataListCell
        className="odc-topology-list-view__label-cell"
        key="label"
        id={`${item.getId()}_label`}
      >
        {badgeCell || <TypedResourceBadgeCell key="type-icon" kind={kind} />}
        <span data-test-id={item.getLabel()}>{item.getLabel()}</span>
        {alertIndicator}
      </DataListCell>
    ),
  );
  if (item.isGroup()) {
    if (item.isCollapsed()) {
      cells.push(groupResourcesCell || <GroupResourcesCell key="resources" group={item} />);
    }
  } else {
    if (!hideAlerts) {
      cells.push(alertsCell || <AlertsCell key="alerts" item={item} />);
    }
    if (!noPods) {
      if (!selectedIds[0]) {
        cells.push(memoryCell || <MemoryCell key="memory" item={item} />);
        cells.push(cpuCell || <CpuCell key="cpu" item={item} />);
      }
      cells.push(statusCell || <StatusCell key="status" item={item} />);
    }
  }

  const className = css('odc-topology-list-view__item-row', { 'is-filtered': filtered });
  return (
    <DataListItem
      key={item.getId()}
      id={item.getId()}
      aria-labelledby={`${item.getId()}_label`}
      isExpanded={children !== undefined}
      data-test={`row-${item.getLabel()}`}
    >
      <DataListItemRow className={className}>
        <DataListItemCells dataListCells={cells} />
      </DataListItemRow>
      {children ? (
        <DataListContent
          className="odc-topology-list-view__group-children"
          aria-label={t('topology~{{kindLabel}} {{label}}', {
            label: item.getLabel(),
            kindLabel: modelFor(kind)?.label ?? kind,
          })}
          id={`${item.getId()}-${item.getLabel()}`}
          isHidden={false}
        >
          <DataList
            aria-label={t('topology~{{label}} sub-resources', { label: item.getLabel() })}
            selectedDataListItemId={selectedIds[0]}
            onSelectDataListItem={(_event, id) => onSelect(selectedIds[0] === id ? [] : [id])}
          >
            {children}
          </DataList>
        </DataListContent>
      ) : null}
    </DataListItem>
  );
};

const TopologyListViewNodeDispatchToProps = (dispatch): DispatchProps => ({
  onSelectTab: (name) => dispatch(selectOverviewDetailsTab(name)),
});

export default connect<{}, DispatchProps, TopologyListViewNodeProps>(
  null,
  TopologyListViewNodeDispatchToProps,
)(observer(TopologyListViewNode));
