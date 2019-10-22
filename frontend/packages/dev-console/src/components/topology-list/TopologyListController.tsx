import * as React from 'react';
import * as _ from 'lodash';
import { cx } from 'emotion';
import { ListView } from 'patternfly-react';
import { StatusBox, FirehoseResult, ResourceIcon } from '@console/internal/components/utils';
import { TransformResourceData, OverviewItem } from '@console/shared';
import { groupItems } from '@console/internal/components/overview';
import { DeploymentKind } from '@console/internal/module/k8s';
import { EmptyMsg } from '../topology/TopologyPage';

import './TopologyListController.scss';

type TopologyListDataResource = {
  deployments: FirehoseResult<DeploymentKind[]>;
  deploymentConfigs: FirehoseResult;
  statefulSets: FirehoseResult;
  daemonSets: FirehoseResult;
};

type TopologyListControllerProps = {
  resources?: TopologyListDataResource;
  loadError?: string;
  loaded?: boolean;
};

type TopologyListProps = {
  items: OverviewItem[];
};

type TopologyListGroupProps = {
  heading: string;
  items: OverviewItem[];
};

const skeletonOverview = (
  <div className="skeleton-overview odc-topology-list-controller">
    <div className="skeleton-overview--head" />
    <div className="skeleton-overview--tile" />
    <div className="skeleton-overview--tile" />
    <div className="skeleton-overview--tile" />
  </div>
);

const TopologyListItem = ({ item }) => {
  const { obj } = item;
  const { name, uid } = obj.metadata;
  const { kind } = obj;

  const heading = (
    <h3>
      <ResourceIcon kind={kind} />
      {name}
    </h3>
  );

  return <ListView.Item heading={heading} id={uid} />;
};

const TopologyList: React.SFC<TopologyListProps> = ({ items }) => {
  const listItems = _.map(items, (item) => (
    <TopologyListItem item={item} key={item.obj.metadata.uid} />
  ));
  return <ListView>{listItems}</ListView>;
};

const TopologyListGroup: React.FC<TopologyListGroupProps> = ({ heading, items }) => (
  <div>
    <h2>{heading}</h2>
    <TopologyList items={items} />
  </div>
);

const TopologyListController: React.FC<TopologyListControllerProps> = (props) => {
  const { resources, loadError, loaded } = props;

  const transformResourceData = new TransformResourceData(props);
  const list = [
    ...transformResourceData.createDeploymentItems(resources.deployments.data),
    ...transformResourceData.createDaemonSetItems(resources.daemonSets.data),
    ...transformResourceData.createDeploymentConfigItems(resources.deploymentConfigs.data),
    ...transformResourceData.createStatefulSetItems(resources.statefulSets.data),
  ];

  return (
    <div className={cx({ 'odc-topology-list-controller': !_.isEmpty(list) })}>
      <StatusBox
        skeleton={skeletonOverview}
        data={list}
        label="Topology"
        loaded={loaded}
        loadError={loadError}
        EmptyMsg={EmptyMsg}
      >
        {_.map(groupItems(list, '#GROUP_BY_APPLICATION#'), ({ name, items }, index) => (
          <TopologyListGroup key={name || `_${index}`} heading={name} items={items} />
        ))}
      </StatusBox>
    </div>
  );
};

export default TopologyListController;
