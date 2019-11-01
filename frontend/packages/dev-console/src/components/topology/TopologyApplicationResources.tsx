import * as React from 'react';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { modelFor } from '@console/internal/module/k8s';
import ApplicationGroupResource from './ApplicationGroupResource';
import { TopologyDataObject } from './topology-types';
import { getResourceDeploymentObject } from './topology-utils';

import './TopologyApplicationResources.scss';

export type TopologyApplicationResourcesProps = {
  resources: TopologyDataObject[];
  group: string;
};

const TopologyApplicationResources: React.FC<TopologyApplicationResourcesProps> = ({
  resources,
  group,
}) => {
  const resourcesData = {};
  _.forEach(resources, (res) => {
    const a = getResourceDeploymentObject(res);
    resourcesData[a.kind] = [...(resourcesData[a.kind] ? resourcesData[a.kind] : []), a];
  });

  return (
    <>
      <div
        className={classNames(
          'co-m-horizontal-nav__menu',
          'co-m-horizontal-nav__menu--within-sidebar',
          'co-m-horizontal-nav__menu--within-overview-sidebar',
          'odc-application-resource-tab',
        )}
      >
        <ul className="co-m-horizontal-nav__menu-primary">
          <li className="co-m-horizontal-nav__menu-item">
            <button type="button">Resources</button>
          </li>
        </ul>
      </div>
      {_.map(_.keys(resourcesData), (key) => (
        <ApplicationGroupResource
          key={`${group}-${key}`}
          title={modelFor(key) ? modelFor(key).label : key}
          kind={key}
          resourcesData={resourcesData[key]}
          group={group}
        />
      ))}
    </>
  );
};

export default TopologyApplicationResources;
