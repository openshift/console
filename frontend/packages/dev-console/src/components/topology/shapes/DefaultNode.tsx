import * as React from 'react';
import { NodeProps } from '../topology-types';
import BaseNode from './BaseNode';

const DefaultNode: React.FC<NodeProps> = ({ x, y, size, selected, onSelect, name, isDragging }) => (
  <BaseNode
    x={x}
    y={y}
    label={name}
    outerRadius={size / 2}
    selected={selected}
    onSelect={onSelect}
    isDragging={isDragging}
  />
);

export default DefaultNode;
