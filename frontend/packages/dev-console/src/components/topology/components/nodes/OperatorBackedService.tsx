import * as React from 'react';
import { Node, observer, WithSelectionProps } from '@console/topology';
import OperatorBackedServiceGroup from './OperatorBackedServiceGroup';
import OperatorBackedServiceNode from './OperatorBackedServiceNode';

import './OperatorBackedService.scss';

export type OperatorBackedServiceProps = {
  element: Node;
} & WithSelectionProps;

const OperatorBackedService: React.FC<OperatorBackedServiceProps> = (
  props: OperatorBackedServiceProps,
) => {
  if (
    props.element.isCollapsed() ||
    !props.element.getData().groupResources ||
    !props.element.getData().groupResources.length
  ) {
    return <OperatorBackedServiceNode {...props} />;
  }

  return <OperatorBackedServiceGroup {...props} />;
};

export default observer(OperatorBackedService);
