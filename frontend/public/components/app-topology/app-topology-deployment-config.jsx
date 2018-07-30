import * as _ from 'lodash-es';
import * as React from 'react';
import * as PropTypes from 'prop-types';
import classNames from 'classnames';

import { AppTopologyPodDonut } from "./app-topology-pod-donut";

export const AppTopologyDeploymentConfig = ({deploymentConfig, selected, handleItemClick}) => {
  if (!deploymentConfig) {
    return null;
  }

  const currentController = _.size(_.get(deploymentConfig, 'currentController.pods')) ?
    deploymentConfig.currentController :
    deploymentConfig.prevController;

  const labelClasses = classNames('app-topology-node-label', {selected: selected});

  const drawSelection = () => {
    const backgroundClasses = classNames('app-topology-background-circle', {selected: selected});
    return (
      <svg className="app-topology-deployment-config-background" xmlns="http://www.w3.org/2000/svg">
        <g>
          <circle className={backgroundClasses} r={selected ? 37 : 32} cx={41} cy={48} />
        </g>
      </svg>
    );
  };

  return (
    <div className="app-topology-deployment-config">
      <span onClick={() => handleItemClick(deploymentConfig)}>
        {drawSelection()}
        <AppTopologyPodDonut id={_.get(deploymentConfig, 'metadata.uid')} mini controller={currentController}/>
      </span>
      <span className={labelClasses}>
        {_.get(deploymentConfig, 'metadata.name')}
      </span>
    </div>
  );
};

AppTopologyDeploymentConfig.defaultProps = {
};

AppTopologyDeploymentConfig.propTypes = {
  deploymentConfig: PropTypes.object,
  selected: PropTypes.bool,
  handleItemClick: PropTypes.func
};
