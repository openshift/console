import * as React from 'react';
import Helmet from 'react-helmet';
import { navFactory, FirehoseResource } from '@console/internal/components/utils';
import { PodsPage } from '@console/internal/components/pod';
import { ResourceEventStream } from '@console/internal/components/events';
import { DetailsPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { MachineModel, NodeModel, CertificateSigningRequestModel } from '@console/internal/models';
import { connectToPlural } from '@console/internal/kinds';
import { ResourceDetailsPageProps } from '@console/internal/components/resource-list';
import { useFlag } from '@console/shared/src/hooks/flag';
import { NodeMaintenanceModel, BareMetalHostModel } from '../../models';
import { menuActionsCreator } from './menu-actions';
import BareMetalNodeDetails from './BareMetalNodeDetails';
import { NODE_MAINTENANCE_FLAG } from '../../features';
import BareMetalNodeDashboard from './dashboard/BareMetalNodeDashboard';

const { editYaml, events, pods } = navFactory;

const pages = [
  {
    href: '',
    name: 'Overview',
    component: BareMetalNodeDashboard,
  },
  {
    href: 'details',
    name: 'Details',
    component: BareMetalNodeDetails,
  },
  editYaml(),
  pods(({ obj }) => (
    <PodsPage showTitle={false} fieldSelector={`spec.nodeName=${obj.metadata.name}`} />
  )),
  events(ResourceEventStream),
];

type BareMetalNodeDetailsPageProps = ResourceDetailsPageProps & {
  plural: string;
};

const BareMetalNodeDetailsPage = connectToPlural((props: BareMetalNodeDetailsPageProps) => {
  const hasNodeMaintenanceCapability = useFlag(NODE_MAINTENANCE_FLAG);
  const resources: FirehoseResource[] = [
    {
      kind: referenceForModel(MachineModel),
      namespaced: true,
      isList: true,
      prop: 'machines',
    },
    {
      kind: referenceForModel(BareMetalHostModel),
      namespaced: true,
      isList: true,
      prop: 'hosts',
    },
    {
      kind: CertificateSigningRequestModel.kind,
      namespaced: false,
      isList: true,
      prop: 'csrs',
    },
  ];

  if (hasNodeMaintenanceCapability) {
    resources.push({
      kind: referenceForModel(NodeMaintenanceModel),
      namespaced: false,
      isList: true,
      prop: 'nodeMaintenances',
      optional: true,
    });
  }

  const { modelRef, plural, kindObj, match } = props;
  const { name } = match.params;
  return (
    <>
      <Helmet>
        <title>{`${name} · Details`}</title>
      </Helmet>
      <DetailsPage
        {...props}
        name={name}
        menuActions={menuActionsCreator}
        pages={pages}
        resources={resources}
        kind={modelRef}
        customData={{ hasNodeMaintenanceCapability }}
        breadcrumbsFor={() => [
          {
            name: `${kindObj.labelPlural}`,
            path: `/k8s/cluster/${plural}`,
          },
          { name: `${kindObj.label} Details`, path: `${match.url}` },
        ]}
      />
    </>
  );
});

export default (props) => <BareMetalNodeDetailsPage plural={NodeModel.plural} {...props} />;
