import * as React from 'react';
import {
  Node,
  observer,
  WithSelectionProps,
  WithDndDropProps,
  WithContextMenuProps,
} from '@patternfly/react-topology';
import './KafkaConnection.scss';
import KafkaNode from './KafkaNode';

type KafkaConnectionProps = {
  element: Node;
} & WithSelectionProps &
  WithContextMenuProps &
  WithDndDropProps;

const KafkaConnection: React.FC<KafkaConnectionProps> = (props) => {

  return <KafkaNode  {...props} />;
};

export default observer(KafkaConnection);
