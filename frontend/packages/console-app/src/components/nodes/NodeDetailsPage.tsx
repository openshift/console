import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ResourceEventStream } from '@console/internal/components/events';
import { DetailsPage } from '@console/internal/components/factory';
import { PodsPage } from '@console/internal/components/pod';
import { navFactory } from '@console/internal/components/utils';
import { NodeKind } from '@console/internal/module/k8s';
import { nodeStatus } from '../../status/node';
import { menuActions } from './menu-actions';
import NodeDashboard from './node-dashboard/NodeDashboard';
import NodeDetails from './NodeDetails';
import NodeTerminal from './NodeTerminal';

const NodeDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const { editYaml, events, pods } = navFactory;
  const { t } = useTranslation();

  const pagesFor = React.useCallback(
    (node: NodeKind) => [
      {
        href: '',
        name: t('nodes~Overview'),
        component: NodeDashboard,
      },
      {
        href: 'details',
        name: t('nodes~Details'),
        component: NodeDetails,
      },
      editYaml(),
      pods(({ obj }) => (
        <PodsPage
          showTitle={false}
          fieldSelector={`spec.nodeName=${obj.metadata.name}`}
          customData={{ showNamespaceOverride: true }}
        />
      )),
      events(ResourceEventStream),
      ...(!_.some(
        node?.metadata?.labels,
        (v, k) =>
          (k === 'node.openshift.io/os_id' && v === 'Windows') ||
          (k === 'corev1.LabelOSStable' && v === 'windows'),
      )
        ? [{ href: 'terminal', name: t('nodes~Terminal'), component: NodeTerminal }]
        : []),
    ],
    [editYaml, events, pods, t],
  );

  return (
    <DetailsPage
      {...props}
      getResourceStatus={nodeStatus}
      menuActions={menuActions}
      pagesFor={pagesFor}
    />
  );
};

export default NodeDetailsPage;
