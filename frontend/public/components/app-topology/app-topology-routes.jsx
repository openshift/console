import * as _ from 'lodash-es';
import * as React from 'react';
import * as PropTypes from 'prop-types';
import { Icon } from 'patternfly-react/dist/js/components/Icon';
import { OverlayTrigger } from 'patternfly-react/dist/js/components/OverlayTrigger';
import { Tooltip } from 'patternfly-react/dist/js/components/Tooltip';
import classNames from "classnames";

export const AppTopologyRoutes = ({routes, selectedItem, handleItemClick}) => {
  const renderRoute = (route) => {
    const selected = selectedItem === route;
    const backgroundClasses = classNames('app-topology-background-circle', {selected: selected});

    return (
      <div key={_.get(route, 'metadata.uid')} className="app-topology-route">
        <OverlayTrigger
          placement="top"
          id={_.get(route, 'metadata.uid')}
          overlay={<Tooltip id={_.get(route, 'spec.host')}>{_.get(route, 'spec.host')}</Tooltip>}
        >
          <div className="app-topology-node-container" onClick={() => handleItemClick(route)}>
            <svg className="app-topology-route-background" xmlns="http://www.w3.org/2000/svg">
              <g>
                <circle
                  className={backgroundClasses}
                  r={selected ? 20 : 22}
                  cx={22}
                  cy={22}
                >
                </circle>
              </g>
            </svg>
            <Icon className="route-icon" type="pf" name="route" />
          </div>
        </OverlayTrigger>
      </div>
    )
  };

  return (
    <div className="app-topology-routes">
      {_.map(routes, route => renderRoute(route))}
    </div>
  );
};

AppTopologyRoutes.defaultProps = {
};

AppTopologyRoutes.propTypes = {
  routes: PropTypes.arrayOf(PropTypes.object),
  selectedItem: PropTypes.object,
  handleItemClick: PropTypes.func
};
