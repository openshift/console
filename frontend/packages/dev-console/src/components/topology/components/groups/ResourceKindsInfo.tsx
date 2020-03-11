import * as React from 'react';
import * as _ from 'lodash';
import { modelFor, referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { getTopologyResourceObject } from '../../topology-utils';
import { TopologyDataObject } from '../../topology-types';
import { ResourceIcon } from '@console/internal/components/utils';

import './ResourceKindsInfo.scss';

type ResourceKindsInfoProps = {
  groupResources: TopologyDataObject;
  emptyValue?: React.ReactNode;
  width: number;
  height: number;
};

const ResourceKindsInfo: React.FC<ResourceKindsInfoProps> = ({
  groupResources,
  emptyValue,
  width,
  height,
}) => {
  const resourcesData = {};
  _.forEach(groupResources, (res: TopologyDataObject) => {
    const a = getTopologyResourceObject(res);
    const kindObj = modelFor(referenceFor(a));
    const key = kindObj.abbr || a.kind;
    resourcesData[key] = [...(resourcesData[key] ? resourcesData[key] : []), a];
  });
  const resourceTypes = _.keys(resourcesData);

  if (!resourceTypes.length) {
    return (
      <foreignObject width={width} height={height}>
        <div className="odc-resource-kinds-info">{emptyValue}</div>
      </foreignObject>
    );
  }

  return (
    <foreignObject width={width} height={height}>
      <div className="odc-resource-kinds-info">
        <table className="odc-resource-kinds-info__table">
          <tbody className="odc-resource-kinds-info__body">
            {resourceTypes.map((key) => {
              const kindObj = modelFor(referenceFor(resourcesData[key][0]));
              return (
                <tr key={key} className="odc-resource-kinds-info__row">
                  <td className="odc-resource-kinds-info__count">{resourcesData[key].length}</td>
                  <td className="odc-resource-kinds-info__resource-icon">
                    <ResourceIcon kind={kindObj.crd ? referenceForModel(kindObj) : kindObj.kind} />
                  </td>
                  <td className="odc-resource-kinds-info__kind">
                    {resourcesData[key].length > 1 ? kindObj.labelPlural : kindObj.label}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </foreignObject>
  );
};

export { ResourceKindsInfo };
