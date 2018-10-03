import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import * as classnames from 'classnames';
import { Link } from 'react-router-dom';
import { ListView } from 'patternfly-react';

import { pluralize, ResourceIcon, resourceObjPath, resourcePath } from './utils';
import { Tooltip } from './utils/tooltip';

const ControllerLink = ({controller}) => {
  const { obj, revision } = controller;
  const { name } = obj.metadata;
  const label = _.isFinite(revision) ? `#${revision}` : name;
  return <Link to={resourceObjPath(obj, obj.kind)} title={name}>{label}</Link>;
};

export const ComponentLabel = ({text}) => <div className="co-component-label">{text}</div>;

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
      <ComponentLabel text="Status" />
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

const ProjectOverviewListItem = ({item, onClick, selectedItem}) => {
  const {current, obj} = item;
  const {namespace, name, uid} = obj.metadata;
  const isSelected = uid === _.get(selectedItem, 'obj.metadata.uid', '');
  const className = classnames('project-overview__item', {'project-overview__item--selected': isSelected});
  const heading = <h3 className="project-overview__item-heading">
    <span className="co-resource-link co-resource-link-truncate">
      <ResourceIcon kind={obj.kind} />
      <Link to={resourcePath(obj.kind, name, namespace)} className="co-resource-link__resource-name">
        {name}
      </Link>
      {current && <React.Fragment>,&nbsp;<ControllerLink controller={current} /></React.Fragment>}
    </span>
  </h3>;

  const additionalInfo = <div key={uid} className="project-overview__additional-info">
    <Alerts item={item} />
    <Status item={item} />
  </div>;
  return <ListView.Item
    onClick={() => isSelected ? onClick({}) : onClick(item)}
    className={className}
    heading={heading}
    additionalInfo={[additionalInfo]}
  />;
};

ProjectOverviewListItem.displayName = 'ProjectOverviewListItem';

ProjectOverviewListItem.propTypes = {
  item: PropTypes.shape({
    controller: PropTypes.object,
    obj: PropTypes.object.isRequired,
    readiness: PropTypes.object,
  }).isRequired
};

const ProjectOverviewList = ({items, onClickItem, selectedItem}) => {
  const listItems = _.map(items, (item) =>
    <ProjectOverviewListItem
      key={item.obj.metadata.uid}
      item={item}
      onClick={onClickItem}
      selectedItem={selectedItem}
    />
  );
  return <ListView className="project-overview__list">
    {listItems}
  </ListView>;
};


ProjectOverviewList.displayName = 'ProjectOverviewList';

ProjectOverviewList.propTypes = {
  items: PropTypes.array.isRequired
};

const ProjectOverviewGroup = ({heading, items, onClickItem, selectedItem}) =>
  <div className="project-overview__group">
    {heading && <h2 className="project-overview__group-heading">{heading}</h2>}
    <ProjectOverviewList items={items} onClickItem={onClickItem} selectedItem={selectedItem} />
  </div>;


ProjectOverviewGroup.displayName = 'ProjectOverviewGroup';

ProjectOverviewGroup.propTypes = {
  heading: PropTypes.string,
  items: PropTypes.array.isRequired
};

export const ProjectOverview = ({selectedItem, groups, onClickItem}) =>
  <div className="project-overview">
    {_.map(groups, ({name, items}) =>
      <ProjectOverviewGroup
        key={name}
        heading={name}
        items={items}
        onClickItem={onClickItem}
        selectedItem={selectedItem}
      />
    )}
  </div>;

ProjectOverview.displayName = 'ProjectOverview';

ProjectOverview.propTypes = {
  groups: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      items: PropTypes.array.isRequired
    })
  )
};
