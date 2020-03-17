import * as React from 'react';
import { navFactory } from '@console/internal/components/utils';
import { PodsPage } from '@console/internal/components/pod';
import { ResourceEventStream } from '@console/internal/components/events';
import { DetailsPage } from '@console/internal/components/factory';
import { nodeStatus } from '../../status/node';
import NodeDetails from './NodeDetails';
import NodeTerminal from './NodeTerminal';
import { menuActions } from './menu-actions';

const { details, editYaml, events, pods } = navFactory;

const pages = [
  details(NodeDetails),
  editYaml(),
  pods(({ obj }) => (
    <PodsPage showTitle={false} fieldSelector={`spec.nodeName=${obj.metadata.name}`} />
  )),
  events(ResourceEventStream),
  {
    href: 'terminal',
    name: 'Terminal',
    component: NodeTerminal,
  },
];
const NodeDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => (
  <DetailsPage {...props} getResourceStatus={nodeStatus} menuActions={menuActions} pages={pages} />
);

export default NodeDetailsPage;
