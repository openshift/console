import * as _ from 'lodash-es';
import * as React from 'react';
import * as PropTypes from 'prop-types';

const MARGIN_LEFT = 16;
const NODE_WIDTH = 50;
const PADDING_RIGHT = 10;

const getConnectionPoints = index => {
  const startPointX = MARGIN_LEFT + (NODE_WIDTH * index) - (NODE_WIDTH / 2) + (PADDING_RIGHT * (index - 1));
  const startPointY = 0;
  const endPointX = 41;
  const endPointY = 50;

  return `${startPointX},${startPointY} ${endPointX},${endPointY}`;
};

export const AppTopologyConnectors = ({routes}) => {
  const numRoutes = _.size(routes);

  if (!numRoutes) {
    return null;
  }

  return (
    <svg className="app-topology-connector"
         xmlns="http://www.w3.org/2000/svg"
         width={MARGIN_LEFT + (NODE_WIDTH * numRoutes)}>
      <g className="connections">
        {_.map(routes, (route, index) => (
          <polyline
            key={index}
            className="app-topology-connection-line"
            points={getConnectionPoints(index + 1)}
          />
        ))}
      </g>
    </svg>
  );
};

AppTopologyConnectors.defaultProps = {
};

AppTopologyConnectors.propTypes = {
  routes: PropTypes.arrayOf(PropTypes.object)
};
