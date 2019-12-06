import * as React from 'react';
import { NodeProps } from '../../topology2/topology-types';
import BaseNode from './BaseNode';

const DefaultNode: React.FC<NodeProps> = ({ x, y, size, name, ...others }) => (
  <BaseNode x={x} y={y} label={name} outerRadius={size / 2} {...others} />
);

export default DefaultNode;
