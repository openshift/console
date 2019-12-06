import * as React from 'react';
import { EdgeProps } from '../../topology2/topology-types';
import BaseEdge from './BaseEdge';

export type DefaultEdgeProps = EdgeProps;

const DefaultEdge: React.SFC<DefaultEdgeProps> = ({ source, target, isDragging }) => (
  <BaseEdge source={source} target={target} isDragging={isDragging} />
);

export default DefaultEdge;
