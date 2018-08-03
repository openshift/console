import * as _ from 'lodash-es';
import * as React from 'react';
import * as PropTypes from 'prop-types';

import { AppTopologyItem } from './app-topology-item';

export const AppTopologyGroup = ({group, selectedGroup, selectedItem, handleItemClick}) => {
  if (!group || !_.size(group.items)) {
    return null;
  }

  return (
    <div className="app-topology-group">
      <h5><strong>{`${selectedGroup}: `}</strong>{group.name}</h5>
      <div className="app-topology-group-items">
        {_.map(group.items, item =>
          <AppTopologyItem
            key={_.get(item.deploymentConfig, 'metadata.uid')}
            deploymentConfig={item.deploymentConfig}
            routes={item.routes}
            selectedItem={selectedItem}
            handleItemClick={handleItemClick}/>
        )}
      </div>
    </div>
  );
};

AppTopologyGroup.defaultProps = {
};

AppTopologyGroup.propTypes = {
  group: PropTypes.object,
  selectedGroup: PropTypes.string.isRequired,
  selectedItem: PropTypes.object,
  handleItemClick: PropTypes.func
};
