import * as React from 'react';
import * as _ from 'lodash';
import { getTitleForNodeKind } from '@console/shared';
import { OdcNodeModel } from '../../topology-types';
import ApplicationGroupResource from './ApplicationGroupResource';

import './TopologyApplicationResources.scss';

type TopologyApplicationResourcesProps = {
  resources: OdcNodeModel[];
  group: string;
};

const TopologyApplicationResources: React.FC<TopologyApplicationResourcesProps> = ({
  resources,
  group,
}) => {
  const resourcesData = resources.reduce((acc, { resource }) => {
    if (resource?.kind) {
      acc[resource.kind] = [...(acc[resource.kind] ? acc[resource.kind] : []), resource];
    }
    return acc;
  }, {});

  return (
    <>
      {_.map(_.keys(resourcesData), (key) => (
        <ApplicationGroupResource
          key={`${group}-${key}`}
          title={getTitleForNodeKind(key)}
          resourcesData={resourcesData[key]}
          group={group}
        />
      ))}
    </>
  );
};

export default TopologyApplicationResources;
