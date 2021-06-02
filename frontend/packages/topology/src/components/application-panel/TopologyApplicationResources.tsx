import * as React from 'react';
import * as classNames from 'classnames';
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
    acc[resource.kind] = [...(acc[resource.kind] ? acc[resource.kind] : []), resource];
    return acc;
  }, {});

  return (
    <>
      <ul
        className={classNames(
          'co-m-horizontal-nav__menu',
          'co-m-horizontal-nav__menu--within-sidebar',
          'co-m-horizontal-nav__menu--within-overview-sidebar',
          'odc-application-resource-tab',
        )}
      >
        <li className="co-m-horizontal-nav__menu-item">
          <button type="button">{t('topology~Resources')}</button>
        </li>
      </ul>
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
