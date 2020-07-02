import * as _ from 'lodash-es';
import * as classnames from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Button, Tooltip, TooltipPosition } from '@patternfly/react-core';

import { ListView, ListViewItem } from './list-view';
import {
  KEYBOARD_SHORTCUTS,
  Status as TooltipStatus,
  YellowExclamationTriangleIcon,
  PodControllerOverviewItem,
  OverviewItem,
  AlertSeverityIcon,
  getSeverityAlertType,
  getFiringAlerts,
} from '@console/shared';
import { K8sResourceKind } from '../../module/k8s';
import * as UIActions from '../../actions/ui';
import {
  ResourceIcon,
  formatBytesAsMiB,
  formatCores,
  pluralize,
  resourceObjPath,
  truncateMiddle,
} from '../utils';

import { OverviewGroup, OverviewMetrics } from '.';

// Consider this mobile if the device screen width is less than 768. (This value shouldn't change.)
const isMobile = window.screen.width < 768;

const ControllerLink: React.SFC<ControllerLinkProps> = ({ controller }) => {
  const { obj, revision } = controller;
  const { name } = obj.metadata;
  const label = _.isFinite(revision) ? `#${revision}` : name;
  return (
    <Link to={resourceObjPath(obj, obj.kind)} title={name}>
      {label}
    </Link>
  );
};

export const ComponentLabel: React.SFC<ComponentLabelProps> = ({ text }) => (
  <div className="co-component-label">{text}</div>
);

const MetricsTooltip: React.SFC<MetricsTooltipProps> = ({ metricLabel, byPod, children }) => {
  const sortedMetrics = _.orderBy(byPod, ['value', 'name'], ['desc', 'asc']);
  const content: any[] = _.isEmpty(sortedMetrics)
    ? [<React.Fragment key="no-metrics">No {metricLabel} metrics available.</React.Fragment>]
    : _.concat(
        <div className="project-overview__metric-tooltip-title" key="#title">
          {metricLabel} Usage by Pod
        </div>,
        sortedMetrics.map(({ name, formattedValue }) => (
          <div key={name} className="project-overview__metric-tooltip">
            <div className="project-overview__metric-tooltip-name">
              <span className="no-wrap">{truncateMiddle(name)}</span>
            </div>
            <div className="project-overview__metric-tooltip-value">{formattedValue}</div>
          </div>
        )),
      );

  const keepLines = 6;
  // Don't remove a single line to show a "1 other" message since there's space to show the last pod in that case.
  // Make sure we always remove at least 2 lines if we truncate.
  if (content.length > keepLines + 1) {
    const numRemoved = content.length - keepLines;
    content.splice(
      keepLines,
      numRemoved,
      <div key="#removed-pods">and {numRemoved} other pods</div>,
    );
  }

  // Disable the tooltip on mobile since a touch also opens the sidebar, which
  // immediately covers the tooltip content.
  if (isMobile) {
    return <>{children}</>;
  }
  return (
    <Tooltip content={content} distance={15}>
      <>{children}</>
    </Tooltip>
  );
};

const Metrics: React.SFC<MetricsProps> = ({ metrics, item }) => {
  const getPods = () => {
    if (item.obj.kind === 'Pod') {
      return [item.obj];
    }
    return item.current ? item.current.pods : item.pods;
  };

  if (_.isEmpty(metrics)) {
    return null;
  }

  let totalBytes = 0;
  let totalCores = 0;
  const memoryByPod = [];
  const cpuByPod = [];
  _.each(getPods(), ({ metadata: { name } }: K8sResourceKind) => {
    const bytes = _.get(metrics, ['memory', name]);
    if (_.isFinite(bytes)) {
      totalBytes += bytes;
      const formattedValue = `${formatBytesAsMiB(bytes)} MiB`;
      memoryByPod.push({ name, value: bytes, formattedValue });
    }

    const cores = _.get(metrics, ['cpu', name]);
    if (_.isFinite(cores)) {
      totalCores += cores;
      cpuByPod[name] = `${formatCores(cores)} cores`;
      const formattedValue = `${formatCores(cores)} cores`;
      cpuByPod.push({ name, value: cores, formattedValue });
    }
  });

  if (!totalBytes && !totalCores) {
    return null;
  }

  const formattedMiB = formatBytesAsMiB(totalBytes);
  const formattedCores = formatCores(totalCores);
  return (
    <>
      <div className="project-overview__detail project-overview__detail--memory">
        <MetricsTooltip metricLabel="Memory" byPod={memoryByPod}>
          <span>
            <span className="project-overview__metric-value">{formattedMiB}</span>
            &nbsp;
            <span className="project-overview__metric-unit">MiB</span>
          </span>
        </MetricsTooltip>
      </div>
      <div className="project-overview__detail project-overview__detail--cpu">
        <MetricsTooltip metricLabel="CPU" byPod={cpuByPod}>
          <span>
            <span className="project-overview__metric-value">{formattedCores}</span>
            &nbsp;
            <span className="project-overview__metric-unit">cores</span>
          </span>
        </MetricsTooltip>
      </div>
    </>
  );
};

const Status: React.SFC<StatusProps> = ({ item }) => {
  const { status } = item;
  return status ? (
    <div className="project-overview__detail project-overview__detail--status">{status}</div>
  ) : null;
};

const AlertTooltip = ({ alerts, severity, noSeverityLabel = false }) => {
  const label = severity === 'Info' ? 'Message' : severity;
  const count = _.size(alerts);
  const message = _.uniq(_.map(alerts, 'message')).join('\n');
  const content = [
    <span key="message" className="co-pre-wrap">
      {message}
    </span>,
  ];

  // Disable the tooltip on mobile since a touch also opens the sidebar, which
  // immediately covers the tooltip content.
  if (isMobile) {
    return (
      <span className="project-overview__status">
        <TooltipStatus
          status={severity}
          title={noSeverityLabel ? String(count) : pluralize(count, label)}
        />
      </span>
    );
  }
  return (
    <Tooltip content={content} distance={10}>
      <span className="project-overview__status">
        <TooltipStatus
          status={severity}
          title={noSeverityLabel ? String(count) : pluralize(count, label)}
        />
      </span>
    </Tooltip>
  );
};

const Alerts: React.SFC<AlertsProps> = ({ item }) => {
  const currentAlerts = _.get(item, 'current.alerts', {});
  const previousAlerts = _.get(item, 'previous.alerts', {});
  const itemAlerts = _.get(item, 'alerts', {});
  const alerts = {
    ...itemAlerts,
    ...currentAlerts,
    ...previousAlerts,
  };
  if (_.isEmpty(alerts)) {
    return null;
  }

  const {
    error,
    warning,
    info,
    buildNew,
    buildPending,
    buildRunning,
    buildFailed,
    buildError,
  } = _.groupBy(alerts, 'severity');
  return (
    <div className="project-overview__detail project-overview__detail--alert">
      {error && <AlertTooltip severity="Error" alerts={error} />}
      {warning && <AlertTooltip severity="Warning" alerts={warning} />}
      {info && <AlertTooltip severity="Info" alerts={info} />}
      {(buildNew || buildPending || buildRunning || buildFailed || buildError) && (
        <div className="project-overview__builds">
          Builds {buildNew && <AlertTooltip severity="New" alerts={buildNew} noSeverityLabel />}{' '}
          {buildPending && (
            <AlertTooltip severity="Pending" alerts={buildPending} noSeverityLabel />
          )}{' '}
          {buildRunning && (
            <AlertTooltip severity="Running" alerts={buildRunning} noSeverityLabel />
          )}{' '}
          {buildFailed && <AlertTooltip severity="Failed" alerts={buildFailed} noSeverityLabel />}{' '}
          {buildError && <AlertTooltip severity="Error" alerts={buildError} noSeverityLabel />}
        </div>
      )}
    </div>
  );
};

const projectOverviewListItemStateToProps = ({ UI }): ProjectOverviewListItemPropsFromState => ({
  metrics: UI.getIn(['overview', 'metrics']),
  selectedUID: UI.getIn(['overview', 'selectedUID']),
});

const projectOverviewListItemDispatchToProps = (
  dispatch,
): ProjectOverviewListItemPropsFromDispatch => ({
  selectItem: (uid) => dispatch(UIActions.selectOverviewItem(uid)),
  dismissDetails: () => dispatch(UIActions.dismissOverviewDetails()),
  selectOverviewDetailsTab: (name) => dispatch(UIActions.selectOverviewDetailsTab(name)),
});

export const ResourceItemDeleting = () => (
  <span className="co-resource-item__deleting">
    <YellowExclamationTriangleIcon /> Deleting
  </span>
);

const ProjectOverviewListItem = connect<
  ProjectOverviewListItemPropsFromState,
  ProjectOverviewListItemPropsFromDispatch,
  ProjectOverviewListItemOwnProps
>(
  projectOverviewListItemStateToProps,
  projectOverviewListItemDispatchToProps,
)(
  ({
    dismissDetails,
    item,
    metrics,
    selectItem,
    selectedUID,
    selectOverviewDetailsTab,
  }: ProjectOverviewListItemProps) => {
    const { current, obj, monitoringAlerts } = item;
    const { name, uid, deletionTimestamp } = obj.metadata;
    const { kind } = obj;
    // Hide metrics when a selection is active.
    const hasSelection = !!selectedUID;
    const isSelected = uid === selectedUID;
    const className = classnames(`project-overview__item project-overview__item--${kind}`, {
      'project-overview__item--selected': isSelected,
    });
    const firingAlerts = getFiringAlerts(monitoringAlerts);
    const severityAlertType = getSeverityAlertType(firingAlerts);

    const onClick = (e: React.MouseEvent<any>) => {
      // Don't toggle details if clicking on a link inside the row.
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'a') {
        return;
      }

      if (isSelected) {
        dismissDetails();
      } else {
        selectItem(uid);
      }
    };

    const onSeverityIconClick = () => {
      selectOverviewDetailsTab('Monitoring');
      selectItem(uid);
    };

    const heading = (
      <h3 className="project-overview__item-heading">
        <span className="co-resource-item co-resource-item--truncate">
          <ResourceIcon kind={kind} />
          <Button
            type="button"
            isInline
            onClick={onClick}
            className="pf-c-button--no-default-values project-overview__item-heading--name"
            variant="link"
          >
            {name}
          </Button>
          {current && (
            <>
              ,&nbsp;
              <ControllerLink controller={current} />
            </>
          )}
          {firingAlerts.length > 0 && (
            <Tooltip
              key="monitoringAlert"
              content="Monitoring Alert"
              position={TooltipPosition.right}
            >
              <Button onClick={onSeverityIconClick} variant="plain">
                <AlertSeverityIcon severityAlertType={severityAlertType} />
              </Button>
            </Tooltip>
          )}
          {deletionTimestamp && <ResourceItemDeleting />}
        </span>
      </h3>
    );

    const additionalInfo = (
      <div key={uid} className="project-overview__additional-info">
        <Alerts item={item} />
        {!hasSelection && <Metrics item={item} metrics={metrics} />}
        <Status item={item} />
      </div>
    );

    return (
      <ListViewItem
        onClick={onClick}
        className={className}
        heading={heading}
        additionalInfo={[additionalInfo]}
        id={uid}
      />
    );
  },
);

const ProjectOverviewList: React.SFC<ProjectOverviewListProps> = ({ items }) => {
  const listItems = _.map(items, (item) => (
    <ProjectOverviewListItem item={item} key={item.obj.metadata.uid} />
  ));
  return <ListView className="project-overview__list">{listItems}</ListView>;
};

const ProjectOverviewGroup: React.SFC<ProjectOverviewGroupProps> = ({ heading, items }) => (
  <div className="project-overview__group">
    <h2 className="project-overview__group-heading">{heading}</h2>
    <ProjectOverviewList items={items} />
  </div>
);

const projectOverviewStateToProps = ({ UI }) => ({
  selectedUID: UI.getIn(['overview', 'selectedUID']),
});

const projectOverviewDispatchToProps = (dispatch) => ({
  selectItemUID: (uid: string) => dispatch(UIActions.selectOverviewItem(uid)),
  dismissDetails: () => dispatch(UIActions.dismissOverviewDetails()),
});

class ProjectOverview_ extends React.Component<ProjectOverviewProps> {
  componentDidMount() {
    window.addEventListener('keydown', this.onKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.onKeyDown);
  }

  flatten(): OverviewItem[] {
    return _.flatten(_.map(this.props.groups, 'items'));
  }

  findIndex(items: OverviewItem[], uid: string): number {
    return _.findIndex(items, (i) => _.get(i, 'obj.metadata.uid') === uid);
  }

  selectItem(item: OverviewItem) {
    const uid: string = _.get(item, 'obj.metadata.uid');
    this.props.selectItemUID(uid);
    const element = document.getElementById(uid);
    if (element) {
      element.scrollIntoView({ block: 'nearest' });
    }
  }

  selectPrevious() {
    const { selectedUID } = this.props;
    const allItems = this.flatten();
    if (!selectedUID) {
      this.selectItem(_.last(allItems));
    } else {
      const newIndex = this.findIndex(allItems, selectedUID) - 1;
      const item = _.get(allItems, [newIndex < 0 ? allItems.length - 1 : newIndex]);
      this.selectItem(item);
    }
  }

  selectNext() {
    const { selectedUID } = this.props;
    const allItems = this.flatten();
    if (!selectedUID) {
      this.selectItem(_.first(allItems));
    } else {
      const newIndex = this.findIndex(allItems, selectedUID) + 1;
      const item = _.get(allItems, [newIndex >= allItems.length ? 0 : newIndex]);
      this.selectItem(item);
    }
  }

  stopEvent(e: KeyboardEvent) {
    document.activeElement instanceof HTMLElement && document.activeElement.blur();
    e.stopPropagation();
    e.preventDefault();
  }

  onKeyDown = (e: KeyboardEvent) => {
    const { nodeName } = e.target as Element;
    if (nodeName === 'INPUT' || nodeName === 'TEXTAREA') {
      return;
    }

    switch (e.key) {
      case 'Escape':
        this.stopEvent(e);
        this.props.dismissDetails();
        break;
      case 'k':
      case 'ArrowUp':
        this.stopEvent(e);
        this.selectPrevious();
        break;
      case 'j':
      case 'ArrowDown':
        this.stopEvent(e);
        this.selectNext();
        break;
      default:
        break;
    }
  };

  render() {
    return (
      <div className="project-overview">
        {_.map(this.props.groups, ({ name, items }, index) => (
          <ProjectOverviewGroup key={name || `_${index}`} heading={name} items={items} />
        ))}
        <p className="small text-center hidden-xs">
          <kbd>&uarr;</kbd> and <kbd>&darr;</kbd> selects items, and{' '}
          <kbd>{KEYBOARD_SHORTCUTS.focusFilterInput}</kbd> filters items.
        </p>
      </div>
    );
  }
}
export const ProjectOverview = connect(
  projectOverviewStateToProps,
  projectOverviewDispatchToProps,
)(ProjectOverview_);

type ControllerLinkProps = {
  controller: PodControllerOverviewItem;
};

type ComponentLabelProps = {
  text: string;
};

type MetricsTooltipProps = {
  metricLabel: string;
  byPod: {
    formattedValue: string;
    name: string;
    value: number;
  }[];
};

type MetricsProps = {
  metrics: any;
  item: OverviewItem;
};

type StatusProps = {
  item: OverviewItem;
};

type AlertsProps = {
  item: OverviewItem;
};

type ProjectOverviewListItemPropsFromState = {
  metrics: OverviewMetrics;
  selectedUID: string;
};

type ProjectOverviewListItemPropsFromDispatch = {
  selectItem: (uid: string) => void;
  dismissDetails: () => void;
  selectOverviewDetailsTab: (name: string) => void;
};

type ProjectOverviewListItemOwnProps = {
  item: OverviewItem;
};

type ProjectOverviewListItemProps = ProjectOverviewListItemOwnProps &
  ProjectOverviewListItemPropsFromDispatch &
  ProjectOverviewListItemPropsFromState;

type ProjectOverviewListProps = {
  items: OverviewItem[];
};

type ProjectOverviewGroupProps = {
  heading: string;
  items: OverviewItem[];
};

type ProjectOverviewProps = {
  groups: OverviewGroup[];
  selectedUID: string;
  selectItemUID: (uid: string) => void;
  dismissDetails: () => void;
};
