import * as React from 'react';
import { Node, observer, WithSelectionProps, WithDndDropProps } from '@patternfly/react-topology';
import OperatorBackedServiceGroup from './OperatorBackedServiceGroup';
import OperatorBackedServiceNode from './OperatorBackedServiceNode';

import './OperatorBackedService.scss';

export type OperatorBackedServiceProps = {
  element: Node;
} & WithSelectionProps &
  WithDndDropProps;

const OperatorBackedService: React.FC<OperatorBackedServiceProps> = (
  props: OperatorBackedServiceProps,
) => {
  if (props.element.isCollapsed()) {
    return <OperatorBackedServiceNode {...props} />;
  }

  return <OperatorBackedServiceGroup {...props} />;
};

export default observer(OperatorBackedService);
