import * as _ from 'lodash-es';
import * as React from 'react';
import * as PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from 'patternfly-react/dist/js/components/Button';
import { Icon } from 'patternfly-react/dist/js/components/Icon';

import { AppTopologyPodDonut } from './app-topology-pod-donut';

export const AppTopologyMetrics = ({deploymentConfig}) => {
  if (!deploymentConfig) {
    return null;
  }

  const scaleUp = () => {

  };

  const scaleDown = () => {

  };

  const deploymentRunning = _.size(_.get(deploymentConfig, 'currentController.pods')) &&
    _.size(_.get(deploymentConfig, 'prevController.pods'));

  let leftMetrics;
  let metricsAvailable = false;

  if (deploymentRunning) {
    leftMetrics = (
      <AppTopologyPodDonut id="prev-pods-donut" controller={deploymentConfig.prevController}/>
    );
  } else if (metricsAvailable) {
    leftMetrics = null;
  } else {
    leftMetrics = null;
  }

  // Don't show the scaling controls until the HPAs load so they don't appear and quickly disappear
  const showScaling = true; //(hpa && !hpa.length) && (deploymentConfig | canIScale) && !isIdled;
  const scalable = true;
  const scaleDownAvailable = scalable || true; // getDesiredReplicas() !== 0;

  const currentController = _.size(_.get(deploymentConfig, 'currentController.pods')) ?
    deploymentConfig.currentController :
    deploymentConfig.prevController;

  return (
    <div className="topology-details-metrics">
      <div className="details-metric">
        {leftMetrics}
      </div>
      <div className="details-metric">
        <AppTopologyPodDonut id="current-pods-donut" controller={currentController}/>
        {showScaling && (
          <div className="deployment-donut-column scaling-controls fade-inline">
            <div>
              <Button bsStyle="link"
                 onClick={scaleUp}
                 className={classNames({disabled: !scalable})}
                 title={!scalable ? undefined : 'Scale up'}
                 aria-disabled={!scalable ? 'true' : undefined}>
                <Icon type="fa" name="chevron-up" />
                <span className="sr-only">Scale up</span>
              </Button>
            </div>
            <div>
              <Button bsStyle="link"
                      onClick={scaleDown}
                      className={classNames({disabled: !scaleDownAvailable})}
                      title={!scaleDownAvailable ? undefined : 'Scale up'}
                      aria-disabled={!scaleDownAvailable ? 'true' : undefined}>
                <Icon type="fa" name="chevron-down" />
                <span className="sr-only">Scale down</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

AppTopologyMetrics.defaultProps = {
};

AppTopologyMetrics.propTypes = {
  deploymentConfig: PropTypes.object
};
