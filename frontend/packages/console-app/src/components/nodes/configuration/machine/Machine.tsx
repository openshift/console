import type { ComponentType } from 'react';
import type { PageComponentProps } from '@console/internal/components/utils';
import type { NodeKind } from '@console/internal/module/k8s';
import BMCConfiguration from './BMCConfiguration';
import MachineDetails from './MachineDetails';

const NodeMachine: ComponentType<PageComponentProps<NodeKind>> = ({ obj }) => (
  <>
    <MachineDetails node={obj} />
    <BMCConfiguration node={obj} />
  </>
);

export default NodeMachine;
