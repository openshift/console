import * as React from 'react';
import {
  observer,

} from '@patternfly/react-topology';
import {
  BaseNode,
} from '@console/topology/src/components/graph-view';
import { ManagedKafkaConnectionModel } from '../../models';

// import './KafkaNode.scss';

const KafkaNode: React.FC<any> = ({
  element,
  selected,
  onSelect,
  ...rest
}) => {
  console.log("rendering")
  return (
    <BaseNode
      className="testResource"
      onContextMenu={null}
      onSelect={onSelect}
      selected={selected}
      kind={ManagedKafkaConnectionModel.kind}
      element={element}
      outerRadius={100}
      {...rest}
    />
  );
};

export default observer(KafkaNode);
