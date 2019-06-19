import * as React from 'react';
import { EdgeProps } from '../topology-types';
import BaseEdge from './BaseEdge';

export type DefaultEdgeProps = EdgeProps;

const DefaultEdge: React.SFC<DefaultEdgeProps> = ({ source, target }) => (
  <BaseEdge source={source} target={target} />
);

export default DefaultEdge;
