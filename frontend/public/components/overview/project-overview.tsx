import * as _ from 'lodash-es';
import * as classnames from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { ListView } from 'patternfly-react';

import { Tooltip } from '../utils/tooltip';
/* eslint-disable-next-line no-unused-vars */
import { K8sResourceKind } from '../../module/k8s';
import { UIActions } from '../../ui/ui-actions';
import {
  pluralize,
  ResourceIcon,
  resourceObjPath,
  resourcePath
} from '../utils';

const ControllerLink = ({controller}) => {
  const { obj, revision } = controller;
  const { name } = obj.metadata;
  const label = _.isFinite(revision) ? `#${revision}` : name;
  return <Link to={resourceObjPath(obj, obj.kind)} title={name}>{label}</Link>;
};

export const ComponentLabel = ({text}) => <div className="co-component-label">{text}</div>;

const Metrics = ({metrics, item}) => {
  if (_.isEmpty(metrics)) {
    return null;
  }

  const pods = item.current ? item.current.pods : item.pods;
  const totalBytes: number = _.reduce(pods, (total: number, pod: K8sResourceKind) => {
    const bytes: number = _.get(metrics, ['memory', pod.metadata.name]);
    return _.isFinite(bytes) ? total + bytes : total;
  }, 0);

  const totalCores: number = _.reduce(pods, (total: number, pod: K8sResourceKind) => {
    const cores: number = _.get(metrics, ['cpu', pod.metadata.name]);
    return _.isFinite(cores) ? total + cores : total;
  }, 0);

  if (!totalBytes && !totalCores) {
    return null;
  }

  const mib = _.round(totalBytes / 1024 / 1024, 1);
  const cores = _.round(totalCores, 3);
  return <React.Fragment>
    <div className="project-overview__detail project-overview__detail--memory">
      <span className="project-overview__metric-value">{mib || '--'}</span>
      &nbsp;
      <span className="project-overview__metric-unit">MiB</span>
    </div>
    <div className="project-overview__detail project-overview__detail--cpu">
      <span className="project-overview__metric-value">{cores || '--'}</span>
      &nbsp;
      <span className="project-overview__metric-unit">cores</span>
    </div>
  </React.Fragment>;
};

const Status = ({item}) => {
  const {isRollingOut, readiness, obj} = item;
  const {namespace, name} = obj.metadata;
  if (isRollingOut) {
    // TODO: Show pod status for previous and next revisions.
    return <div className="project-overview__detail project-overview__detail--status text-muted">
      Rollout in progress...
    </div>;
  }

  if (readiness) {
    return <div className="project-overview__detail project-overview__detail--status">
      <Link to={`${resourcePath(obj.kind, name, namespace)}/pods`}>
        {readiness.ready} of {readiness.desired} pods
      </Link>
    </div>;
  }

  return null;
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
  return <Tooltip content={content}>
    <i className={iconClass} aria-hidden="true" /> {pluralize(count, label)}
  </Tooltip>;
};

const Alerts = ({item}) => {
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
  selectedUID: UI.getIn(['overview', 'selectedUID'])
});

const projectOverviewListItemDispatchToProps = (dispatch): ProjectOverviewListItemPropsFromDispatch => ({
  onClick: (uid) => dispatch(UIActions.selectOverviewItem(uid))
});

const ProjectOverviewListItem = connect<ProjectOverviewListItemPropsFromState, ProjectOverviewListItemPropsFromDispatch, ProjectOverviewListItemOwnProps>(projectOverviewListItemStateToProps, projectOverviewListItemDispatchToProps)(
  ({item, metrics, onClick, selectedUID}: ProjectOverviewListItemProps) => {
    const {current, obj} = item;
    const {namespace, name, uid} = obj.metadata;
    const {kind} = obj;
    // Hide metrics when a selection is active.
    const hasSelection = !!selectedUID;
    const isSelected = uid === selectedUID;
    const className = classnames('project-overview__item', {'project-overview__item--selected': isSelected});
    const heading = <h3 className="project-overview__item-heading">
      <span className="co-resource-link co-resource-link-truncate">
        <ResourceIcon kind={kind} />
        <Link to={resourcePath(kind, name, namespace)} className="co-resource-link__resource-name">
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

    return <ListView.Item
      onClick={() => onClick(isSelected ? '' : uid)}
      className={className}
      heading={heading}
      additionalInfo={[additionalInfo]}
    />;
  }
);

const ProjectOverviewList: React.SFC<ProjectOverviewListProps> = ({items, metrics}) => {
  const listItems = _.map(items, (item) =>
    <ProjectOverviewListItem
      item={item}
      key={item.obj.metadata.uid}
      metrics={metrics}
    />
  );
  return <ListView className="project-overview__list">
    {listItems}
  </ListView>;
};

const ProjectOverviewGroup: React.SFC<ProjectOverviewGroupProps> = ({heading, items, metrics}) =>
  <div className="project-overview__group">
    {heading && <h2 className="project-overview__group-heading">{heading}</h2>}
    <ProjectOverviewList
      items={items}
      metrics={metrics}
    />
  </div>;



export const ProjectOverview: React.SFC<ProjectOverviewProps> = ({groups, metrics}) =>
  <div className="project-overview">
    {_.map(groups, ({name, items, index}) =>
      <ProjectOverviewGroup
        key={name || `_${index}`}
        heading={name}
        items={items}
        metrics={metrics}
      />
    )}
  </div>;

/* eslint-disable no-unused-vars, no-undef */
type ProjectOverviewListItemPropsFromState = {
  selectedUID: string;
};

type ProjectOverviewListItemPropsFromDispatch = {
  onClick: (uid: string) => void;
};

type ProjectOverviewListItemOwnProps= {
  item: any;
  metrics: any;
};

type ProjectOverviewListItemProps = ProjectOverviewListItemOwnProps & ProjectOverviewListItemPropsFromDispatch & ProjectOverviewListItemPropsFromState;

type ProjectOverviewListProps = {
  items: any[];
  metrics: any;
};

type ProjectOverviewGroupProps = {
  heading: string;
  items: any[];
  metrics: any;
};

type ProjectOverviewProps = {
  groups: {
    index: number;
    name: string;
    items: any[];
  }[];
  metrics: any;
};
/* eslint-enable no-unused-vars, no-undef */
