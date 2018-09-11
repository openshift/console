import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ListView, ListViewItem } from 'patternfly-react';

import { ResourceLink, resourcePath} from './utils';

export const ComponentLabel = ({text}) => <div className="co-component-label">{text}</div>;

const ProjectOverviewListItem = ({obj}) => {
  const {currentController, kind, metadata} = obj;
  const {namespace, name, uid} = metadata;
  const heading = <h3 className="project-overview__item-heading">
    <ResourceLink
      className="co-resource-link-truncate"
      kind={kind}
      name={name}
      namespace={namespace}
    />
  </h3>;

  const additionalInfo = <div key={uid} className="project-overview__additional-info">
    { currentController &&
      <div className="project-overview__detail project-overview__detail--controller">
        <ComponentLabel text={_.startCase(currentController.kind)} />
        <ResourceLink
          className="co-resource-link-truncate"
          kind={currentController.kind}
          name={currentController.metadata.name}
          namespace={namespace}
        />
      </div>
    }
    <div className="project-overview__detail project-overview__detail--status">
      <ComponentLabel text="Status" />
      <Link to={`${resourcePath(kind, name, namespace)}/pods`}>
        {obj.status.replicas || 0} of {obj.spec.replicas} pods
      </Link>
    </div>
  </div>;

  return <ListViewItem
    className="project-overview__item"
    heading={heading}
    additionalInfo={[additionalInfo]}
  />;
};

ProjectOverviewListItem.displayName = 'ProjectOverviewListItem';

ProjectOverviewListItem.propTypes = {
  obj: PropTypes.shape({
    currentController: PropTypes.object,
    kind: PropTypes.string.isRequired,
    metadata: PropTypes.object.isRequired
  }).isRequired
};

const ProjectOverviewList = ({items}) =>
  <ListView className="project-overview__list">
    {_.map(items, (item) => <ProjectOverviewListItem key={item.metadata.uid} obj={item} />)}
  </ListView>;

ProjectOverviewList.displayName = 'ProjectOverviewList';

ProjectOverviewList.propTypes = {
  items: PropTypes.array.isRequired
};

const ProjectOverviewGroup = ({heading, items}) =>
  <div className="project-overview__group">
    {heading && <h2 className="project-overview__group-heading">{heading}</h2>}
    <ProjectOverviewList items={items} />
  </div>;


ProjectOverviewGroup.displayName = 'ProjectOverviewGroup';

ProjectOverviewGroup.propTypes = {
  heading: PropTypes.string.isRequired,
  items: PropTypes.array.isRequired
};

export const ProjectOverview = ({groups}) => {
  return <div className="project-overview">
    { groups.length === 1
      ? <ProjectOverviewList items={groups[0].items} />
      : _.map(groups, ({name, items}, index) => <ProjectOverviewGroup key={index} heading={name} items={items} />)
    }
  </div>;
};

ProjectOverview.displayName = 'ProjectOverview';

ProjectOverview.propTypes = {
  groups: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      items: PropTypes.array.isRequired
    })
  )
};
