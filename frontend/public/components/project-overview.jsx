import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import * as classnames from 'classnames';
import { Link } from 'react-router-dom';
import { ListView } from 'patternfly-react';

import { ResourceLink, resourcePath } from './utils';


export const ComponentLabel = ({text}) => <div className="co-component-label">{text}</div>;

const ProjectOverviewListItem = ({obj, onClick, selectedItem}) => {
  const {currentController, kind, metadata} = obj;
  const {namespace, name, uid} = metadata;
  const isSelected = obj.metadata.uid === _.get(selectedItem, 'metadata.uid', '');
  const className = classnames('project-overview__item', {'project-overview__item--selected': isSelected});
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

  return <ListView.Item
    onClick={() => isSelected ? onClick({}) : onClick(obj)}
    className={className}
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

const ProjectOverviewList = ({items, onClickItem, selectedItem}) => {
  const listItems = _.map(items, (item) =>
    <ProjectOverviewListItem
      key={item.metadata.uid}
      obj={item}
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
    {_.map(groups, ({name, items}, index) =>
      <ProjectOverviewGroup
        key={`overview-group-${name}${index}`}
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
