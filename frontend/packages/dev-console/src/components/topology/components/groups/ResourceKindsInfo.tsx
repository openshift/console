import * as React from 'react';
import * as _ from 'lodash';
import { modelFor, pluralizeKind, referenceForModel } from '@console/internal/module/k8s';
import { ResourceIcon } from '@console/internal/components/utils';

import './ResourceKindsInfo.scss';
import { OdcNodeModel } from '../../topology-types';

type ResourceKindsInfoProps = {
  groupResources: OdcNodeModel[];
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
  _.forEach(groupResources, (node: OdcNodeModel) => {
    const kind = node.resourceKind || node.resource?.kind;
    resourcesData[kind] = [...(resourcesData[kind] ? resourcesData[kind] : []), node.resource];
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
              const kindObj = modelFor(key);
              let kind;
              let label;
              if (kindObj) {
                kind = kindObj.crd ? referenceForModel(kindObj) : kindObj.kind;
                label = resourcesData[key].length > 1 ? kindObj.labelPlural : kindObj.label;
              } else {
                kind = key;
                label = resourcesData[key].length > 1 ? pluralizeKind(key) : _.startCase(key);
              }
              return (
                <tr key={key} className="odc-resource-kinds-info__row">
                  <td className="odc-resource-kinds-info__count">{resourcesData[key].length}</td>
                  <td className="odc-resource-kinds-info__resource-icon">
                    <ResourceIcon kind={kind} />
                  </td>
                  <td className="odc-resource-kinds-info__kind">{label}</td>
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
