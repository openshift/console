import * as React from 'react';
import * as _ from 'lodash';
import { modelFor, referenceForOwnerRef } from '@console/internal/module/k8s';
import { getTopologyResourceObject } from '../../topology-utils';

type ResourceKindsInfoProps = {
  groupResources: any;
  offsetX: number;
  offsetY: number;
};

const TEXT_MARGIN = 10;
const ROW_HEIGHT = 20 + TEXT_MARGIN;

const ResourceKindsInfo: React.FC<ResourceKindsInfoProps> = ({
  groupResources,
  offsetX,
  offsetY,
}) => {
  const resourcesData = {};
  _.forEach(groupResources, (res) => {
    const a = getTopologyResourceObject(res);
    resourcesData[a.kind] = [...(resourcesData[a.kind] ? resourcesData[a.kind] : []), a];
  });

  return (
    <g className="odc-application-group__node-resources">
      {_.map(_.keys(resourcesData), (key, index) => {
        const kindObj = modelFor(referenceForOwnerRef(resourcesData[key][0]));
        const rowX = offsetX;
        const rowY = offsetY + ROW_HEIGHT * index;
        return (
          <g key={key}>
            <text x={rowX} y={rowY} textAnchor="end">
              {resourcesData[key].length}
            </text>
            <text x={rowX + TEXT_MARGIN} y={rowY}>
              {resourcesData[key].length > 1 ? kindObj.labelPlural : kindObj.label}
            </text>
          </g>
        );
      })}
    </g>
  );
};

export default ResourceKindsInfo;
