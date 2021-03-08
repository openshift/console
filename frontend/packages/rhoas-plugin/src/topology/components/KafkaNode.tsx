import * as React from 'react';
import { observer } from '@patternfly/react-topology';
import { BaseNode } from '@console/topology/src/components/graph-view';
import { calculateRadius } from '@console/shared';
import { ManagedKafkaConnectionModel } from '../../models';
import { kafkaIcon } from '../../const';

const KafkaNode: React.FC<any> = ({ element, selected, onSelect, ...props }) => {
  const { width, height } = element.getBounds();
  const size = Math.min(width, height);
  const iconRadius = Math.min(width, height) * 0.25;
  const { radius, decoratorRadius } = calculateRadius(size);

  return (
    <BaseNode
      className="KafkaNode"
      onSelect={onSelect}
      icon={kafkaIcon}
      innerRadius={iconRadius}
      selected={selected}
      kind={ManagedKafkaConnectionModel.kind}
      element={element}
      decoratorRadius={decoratorRadius}
      outerRadius={radius}
      {...props}
    />
  );
};

export default observer(KafkaNode);
