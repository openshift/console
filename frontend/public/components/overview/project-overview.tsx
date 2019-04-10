/* eslint-disable no-unused-vars, no-undef */
import * as _ from 'lodash-es';
import * as classnames from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { ListView } from 'patternfly-react';

import { Tooltip } from '../utils/tooltip';
import { K8sResourceKind } from '../../module/k8s';
import { UIActions } from '../../ui/ui-actions';
import {
  pluralize,
  ResourceIcon,
  resourceObjPath,
  resourcePath,
} from '../utils';

import {
  OverviewGroup,
  OverviewItem,
  OverviewMetrics,
  PodControllerOverviewItem,
} from '.';

const formatToFractionalDigits = (value: number, digits: number): string => Intl.NumberFormat(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);

const formatBytesAsMiB = (bytes: number): string => {
  const mib = bytes / 1024 / 1024;
  return formatToFractionalDigits(mib, 1);
};

const formatCores = (cores: number): string => formatToFractionalDigits(cores, 3);

const overviewTooltipStyles = Object.freeze({
  content: {
    maxWidth: '225px',
  },
  tooltip: {
    minWidth: '225px',
  },
});

const truncateMiddle = (text: string = ''): React.ReactNode => {
  const length = text.length;
  if (length < 20) {
    return text;
  }

  const begin = text.substr(0, 7);
  const end = text.substr(length - 10, length);
  return <span className="text-nowrap">{begin}&hellip;{end}</span>;
};

const ControllerLink: React.SFC<ControllerLinkProps> = ({controller}) => {
  const { obj, revision } = controller;
  const { name } = obj.metadata;
  const label = _.isFinite(revision) ? `#${revision}` : name;
  return <Link to={resourceObjPath(obj, obj.kind)} title={name}>{label}</Link>;
};

export const ComponentLabel: React.SFC<ComponentLabelProps> = ({text}) => <div className="co-component-label">{text}</div>;

const MetricsTooltip: React.SFC<MetricsTooltipProps> = ({metricLabel, byPod, children}) => {
  const sortedMetrics = _.orderBy(byPod, ['value', 'name'], ['desc', 'asc']);
  const content: any[] = _.isEmpty(sortedMetrics)
    ? [<React.Fragment key="no-metrics">No {metricLabel} metrics available.</React.Fragment>]
    : _.concat(<div key="#title">{metricLabel} Usage by Pod</div>, sortedMetrics.map(({name, formattedValue}) => (
      <div key={name} className="project-overview__metric-tooltip">
        <div className="project-overview__metric-tooltip-name">{truncateMiddle(name)}</div>
        <div className="project-overview__metric-tooltip-value">{formattedValue}</div>
      </div>
    )));

  const keepLines = 6;
  // Don't remove a single line to show a "1 other" message since there's space to show the last pod in that case.
  // Make sure we always remove at least 2 lines if we truncate.
  if (content.length > (keepLines + 1)) {
    const numRemoved = content.length - keepLines;
    content.splice(keepLines, numRemoved, <div key="#removed-pods">and {numRemoved} other pods</div>);
  }

  // Disable the tooltip on mobile since a touch also opens the sidebar, which
  // immediately covers the tooltip content.
  return <Tooltip content={content} styles={overviewTooltipStyles} disableOnMobile>{children}</Tooltip>;
};


const Metrics: React.SFC<MetricsProps> = ({metrics, item}) => {
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
  return <React.Fragment>
    <div className="project-overview__detail project-overview__detail--memory">
      <MetricsTooltip metricLabel="Memory" byPod={memoryByPod}>
        <span className="project-overview__metric-value">{formattedMiB}</span>
        &nbsp;
        <span className="project-overview__metric-unit">MiB</span>
      </MetricsTooltip>
    </div>
    <div className="project-overview__detail project-overview__detail--cpu">
      <MetricsTooltip metricLabel="CPU" byPod={cpuByPod}>
        <span className="project-overview__metric-value">{formattedCores}</span>
        &nbsp;
        <span className="project-overview__metric-unit">cores</span>
      </MetricsTooltip>
    </div>
  </React.Fragment>;
};

const Status: React.SFC<StatusProps> = ({item}) => {
  const {status} = item;
  return status ? <div className="project-overview__detail project-overview__detail--status">
    {status}
  </div> : null;
};

const iconClassBySeverity = Object.freeze({
  error: 'pficon pficon-error-circle-o text-danger',
  info: 'pficon pficon-info',
  warning: 'pficon pficon-warning-triangle-o text-warning',
});

const alertLabelBySeverity = Object.freeze({
  error: 'Error',
  info: 'Message',
  warning: 'Warning',
});

const AlertTooltip = ({alerts, severity}) => {
  const iconClass = iconClassBySeverity[severity];
  const label = alertLabelBySeverity[severity];
  const count = _.size(alerts);
  const message = _.map(alerts, 'message').join('\n');
  const content = [<span key="message" className="co-pre-wrap">{message}</span>];

  // Disable the tooltip on mobile since a touch also opens the sidebar, which
  // immediately covers the tooltip content.
  return <Tooltip content={content} styles={overviewTooltipStyles} disableOnMobile>
    <i className={iconClass} aria-hidden="true" /> {pluralize(count, label)}
  </Tooltip>;
};

const Alerts: React.SFC<AlertsProps> = ({item}) => {
  const currentAlerts = _.get(item, 'current.alerts', {});
  const previousAlerts = _.get(item, 'previous.alerts', {});
  const itemAlerts = _.get(item, 'alerts', {});
  const alerts ={
    ...itemAlerts,
    ...currentAlerts,
    ...previousAlerts,
  };
  if (_.isEmpty(alerts)) {
    return null;
  }

  const { error, warning, info } = _.groupBy(alerts, 'severity');
  return <div className="project-overview__detail project-overview__detail--alert">
    {error && <AlertTooltip severity="error" alerts={error} />}
    {warning && <AlertTooltip severity="warning" alerts={warning} />}
    {info && <AlertTooltip severity="info" alerts={info} />}
  </div>;
};

const projectOverviewListItemStateToProps = ({UI}): ProjectOverviewListItemPropsFromState => ({
  metrics: UI.getIn(['overview', 'metrics']),
  selectedUID: UI.getIn(['overview', 'selectedUID']),
});

const projectOverviewListItemDispatchToProps = (dispatch): ProjectOverviewListItemPropsFromDispatch => ({
  selectItem: (uid) => dispatch(UIActions.selectOverviewItem(uid)),
  dismissDetails: () => dispatch(UIActions.dismissOverviewDetails()),
});

const ProjectOverviewListItem = connect<ProjectOverviewListItemPropsFromState, ProjectOverviewListItemPropsFromDispatch, ProjectOverviewListItemOwnProps>(projectOverviewListItemStateToProps, projectOverviewListItemDispatchToProps)(
  ({dismissDetails, item, metrics, selectItem, selectedUID}: ProjectOverviewListItemProps) => {
    const {current, obj} = item;
    const {namespace, name, uid} = obj.metadata;
    const {kind} = obj;
    // Hide metrics when a selection is active.
    const hasSelection = !!selectedUID;
    const isSelected = uid === selectedUID;
    const className = classnames(`project-overview__item project-overview__item--${kind}`, {'project-overview__item--selected': isSelected});
    const heading = <h3 className="project-overview__item-heading">
      <span className="co-resource-item co-resource-item--truncate">
        <ResourceIcon kind={kind} />
        <Link to={resourcePath(kind, name, namespace)} className="co-resource-item__resource-name">
          {name}
        </Link>
        {current && <React.Fragment>,&nbsp;<ControllerLink controller={current} /></React.Fragment>}
      </span>
    </h3>;

    const additionalInfo = <div key={uid} className="project-overview__additional-info">
      <Alerts item={item} />
      {!hasSelection && <Metrics item={item} metrics={metrics} />}
      <Status item={item} />
    </div>;

    const onClick = (e: Event) => {
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

    return <ListView.Item
      onClick={onClick}
      className={className}
      heading={heading}
      additionalInfo={[additionalInfo]}
    />;
  }
);

const ProjectOverviewList: React.SFC<ProjectOverviewListProps> = ({items}) => {
  const listItems = _.map(items, (item) =>
    <ProjectOverviewListItem
      item={item}
      key={item.obj.metadata.uid}
    />
  );
  return <ListView className="project-overview__list">
    {listItems}
  </ListView>;
};

const ProjectOverviewGroup: React.SFC<ProjectOverviewGroupProps> = ({heading, items}) =>
  <div className="project-overview__group">
    <h2 className="project-overview__group-heading">{heading}</h2>
    <ProjectOverviewList
      items={items}
    />
  </div>;

export const ProjectOverview: React.SFC<ProjectOverviewProps> = ({groups}) =>
  <div className="project-overview">
    {_.map(groups, ({name, items}, index) =>
      <ProjectOverviewGroup
        key={name || `_${index}`}
        heading={name}
        items={items}
      />
    )}
  </div>;

type ControllerLinkProps = {
  controller: PodControllerOverviewItem;
};

type ComponentLabelProps = {
  text: string;
};

type MetricsTooltipProps = {
  metricLabel: string;
  byPod: {
    formattedValue: string
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
};

type ProjectOverviewListItemOwnProps= {
  item: OverviewItem;
};

type ProjectOverviewListItemProps = ProjectOverviewListItemOwnProps & ProjectOverviewListItemPropsFromDispatch & ProjectOverviewListItemPropsFromState;

type ProjectOverviewListProps = {
  items: OverviewItem[];
};

type ProjectOverviewGroupProps = {
  heading: string;
  items: OverviewItem[];
};

type ProjectOverviewProps = {
  groups: OverviewGroup[];
};
