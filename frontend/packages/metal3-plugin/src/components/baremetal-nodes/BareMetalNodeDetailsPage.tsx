import * as React from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import { navFactory, FirehoseResource } from '@console/internal/components/utils';
import { PodsPage } from '@console/internal/components/pod';
import { ResourceEventStream } from '@console/internal/components/events';
import { DetailsPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { MachineModel, NodeModel } from '@console/internal/models';
import { connectToPlural } from '@console/internal/kinds';
import { ResourceDetailsPageProps } from '@console/internal/components/resource-list';
import { NodeMaintenanceModel, BareMetalHostModel } from '../../models';
import { menuActionsCreator } from './menu-actions';
import BareMetalNodeDetails from './BareMetalNodeDetails';

const { details, editYaml, events, pods } = navFactory;

const pages = [
  details(BareMetalNodeDetails),
  editYaml(),
  pods(({ obj }) => (
    <PodsPage showTitle={false} fieldSelector={`spec.nodeName=${obj.metadata.name}`} />
  )),
  events(ResourceEventStream),
];

type BareMetalNodeDetailsPageProps = ResourceDetailsPageProps & {
  hasNodeMaintenanceCapability: boolean;
  plural: string;
};

const BareMetalNodeDetailsPage: React.FC<BareMetalNodeDetailsPageProps> = ({
  hasNodeMaintenanceCapability,
  ...props
}) => {
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
};

const mapStateToProps = ({ k8s }) => ({
  hasNodeMaintenanceCapability: !!k8s.getIn([
    'RESOURCES',
    'models',
    referenceForModel(NodeMaintenanceModel),
  ]),
  plural: NodeModel.plural,
});

export default connect(mapStateToProps)(connectToPlural(BareMetalNodeDetailsPage));
