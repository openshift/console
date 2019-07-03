import * as React from 'react';
import { TopologySideBar as PFTopologySideBar } from '@patternfly/react-topology';
import { CloseButton } from '@console/internal/components/utils';
import { ResourceOverviewPage } from '@console/internal/components/overview/resource-overview-page';
import { TopologyDataObject, ResourceProps } from './topology-types';
import './TopologySideBar.scss';

export type TopologySideBarProps = {
  item: TopologyDataObject;
  show: boolean;
  onClose: Function;
};

/**
 * REMOVE: once we get labels in place
 * This is a temporary check to avoid the `Warning: Each child in an array or iterator should have a unique "key" prop`.
 * Its coming when buildConfig/route/service metadata is empty object,
 * BuildOverviewList, RouteOverviewList, ServiceOverview list uses the metadata.uid as the value of `key` prop.
 *
 * Datacontroller get the buildConfigs based on apps.kubernetes.io/instance label which is not applied to apps created using browser catalog
 */

function metadataUIDCheck(items: any): ResourceProps[] {
  return items.filter((item) => item.metadata && item.metadata.uid);
}

const TopologySideBar: React.FC<TopologySideBarProps> = ({ item, show, onClose }) => {
  let itemtoShowOnSideBar;
  if (item) {
    const dc = item.resources.filter(
      (o) => o.kind === 'DeploymentConfig' || o.kind === 'Deployment',
    );
    const routes = metadataUIDCheck(item.resources.filter((o) => o.kind === 'Route'));
    const services = metadataUIDCheck(item.resources.filter((o) => o.kind === 'Service'));
    const buildConfigs = metadataUIDCheck(item.resources.filter((o) => o.kind === 'BuildConfig'));
    itemtoShowOnSideBar = {
      obj: { apiVersion: 'apps.openshift.io/v1', ...dc[0] },
      kind: dc[0].kind,
      routes,
      services,
      buildConfigs,
    };
  }

  return (
    <PFTopologySideBar show={show}>
      <div className="odc-topology-sidebar__dismiss clearfix">
        <CloseButton onClick={onClose} data-test-id="sidebar-close-button" />
      </div>
      {itemtoShowOnSideBar ? (
        <ResourceOverviewPage item={itemtoShowOnSideBar} kind={itemtoShowOnSideBar.kind} />
      ) : null}
    </PFTopologySideBar>
  );
};

export default TopologySideBar;
