import * as React from 'react';
import { NodeProps } from '../topology-types';
import BaseNode from './BaseNode';

const DefaultNode: React.FC<NodeProps> = ({ x, y, size, selected, onSelect, name }) => (
  <BaseNode
    x={x}
    y={y}
    label={name}
    outerRadius={size / 2}
    selected={selected}
    onSelect={onSelect}
  />
);

export default DefaultNode;
