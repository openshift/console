import * as React from 'react';
import { EdgeProps } from '../topology-types';
import BaseEdge from './BaseEdge';
import SvgArrowMarker from './SvgArrowMarker';

type ConnectsToProps = EdgeProps;

const TARGET_ARROW_MARKER_ID = 'connectsToTargetArrowMarker';

const ConnectsTo: React.FC<ConnectsToProps> = ({ source, target, isDragging }) => (
  <React.Fragment>
    <SvgArrowMarker
      id={TARGET_ARROW_MARKER_ID}
      nodeSize={source.size}
      markerSize={12}
      // className={'odc-connects-to-marker'}
    />
    <BaseEdge
      source={source}
      target={target}
      targetMarkerId={TARGET_ARROW_MARKER_ID}
      isDragging={isDragging}
    />
  </React.Fragment>
);

export default ConnectsTo;
