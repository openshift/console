import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { OdcNodeModel } from '../../topology-types';
import { labelKeyForNodeKind } from '../list-view/list-view-utils';
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
  const { t } = useTranslation();
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
          title={t(labelKeyForNodeKind(key))}
          resourcesData={resourcesData[key]}
          group={group}
        />
      ))}
    </>
  );
};

export default TopologyApplicationResources;
