import * as React from 'react';
import * as _ from 'lodash';
import { modelFor, pluralizeKind, referenceForModel } from '@console/internal/module/k8s';
import { ResourceIcon } from '@console/internal/components/utils';
import { OdcNodeModel } from '../../topology-types';

import './ResourceKindsInfo.scss';

export const RESOURCE_INFO_PADDING = 32;
export const RESOURCE_KIND_ROW_WIDTH = 250;
export const RESOURCE_KIND_ROW_HEIGHT = 29;

type ResourceKindsInfoProps = {
  groupResources: OdcNodeModel[];
  emptyValue?: React.ReactNode;
};

const ResourceKindsInfo: React.FC<ResourceKindsInfoProps> = ({ groupResources, emptyValue }) => {
  const resourcesData = {};
  _.forEach(groupResources, (node: OdcNodeModel) => {
    const kind = node.resourceKind || node.resource?.kind;
    resourcesData[kind] = [...(resourcesData[kind] ? resourcesData[kind] : []), node.resource];
  });
  const resourceTypes = _.keys(resourcesData);

  if (!resourceTypes.length) {
    return (
      <foreignObject
        width={RESOURCE_KIND_ROW_WIDTH}
        height={RESOURCE_INFO_PADDING + RESOURCE_KIND_ROW_HEIGHT}
      >
        <div className="odc-resource-kinds-info">{emptyValue}</div>
      </foreignObject>
    );
  }

  return (
    <foreignObject
      width={RESOURCE_KIND_ROW_WIDTH}
      height={RESOURCE_INFO_PADDING + resourceTypes.length * RESOURCE_KIND_ROW_HEIGHT}
    >
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
