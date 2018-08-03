import * as React from 'react';
import * as PropTypes from 'prop-types';

import { AppTopologyRoutes } from './app-topology-routes';
import { AppTopologyConnectors } from './app-topology-connectors';
import { AppTopologyDeploymentConfig } from './app-topology-deployment-config';

export const AppTopologyItem = ({deploymentConfig, routes, selectedItem, handleItemClick}) => {
  if (!deploymentConfig) {
    return null;
  }

  return (
    <div className="app-topology-item">
      <AppTopologyRoutes routes={routes} selectedItem={selectedItem} handleItemClick={handleItemClick}/>
      <AppTopologyConnectors routes={routes} />
      <AppTopologyDeploymentConfig
        deploymentConfig={deploymentConfig}
        selected={selectedItem === deploymentConfig}
        handleItemClick={handleItemClick}/>
    </div>
  );
};

AppTopologyItem.defaultProps = {
};

AppTopologyItem.propTypes = {
  deploymentConfig: PropTypes.object,
  routes: PropTypes.arrayOf(PropTypes.object),
  selectedItem: PropTypes.object,
  handleItemClick: PropTypes.func
};
