import * as React from 'react';
import { observer } from '@patternfly/react-topology';
import { calculateRadius } from '@console/shared';
import { KafkaConnectionModel } from '../../models';
import { kafkaIcon } from '../../const';
import TrapezoidBaseNode from './TrapezoidBaseNode';

import './KafkaNode.scss';

const KafkaNode: React.FC<any> = ({ element, selected, onSelect, ...props }) => {
  const { width, height } = element.getBounds();
  const size = Math.min(width, height);
  const iconRadius = Math.min(width, height) * 0.25;
  const { radius, decoratorRadius } = calculateRadius(size);

  return (
    <TrapezoidBaseNode
      className="KafkaNode"
      onSelect={onSelect}
      icon={kafkaIcon}
      innerRadius={iconRadius}
      selected={selected}
      kind={KafkaConnectionModel.kind}
      element={element}
      decoratorRadius={decoratorRadius}
      outerRadius={radius}
      {...props}
    />
  );
};

export default observer(KafkaNode);
