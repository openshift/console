import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useParams } from 'react-router-dom-v5-compat';

import { referenceForModel } from '@console/internal/module/k8s/k8s';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory, ResourceIcon } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';

import { menuActionCreator } from './block-pool-menu-action';
import { CephClusterKind } from '../../types';
import { cephClusterResource } from '../../resources';
import { BlockPoolDashboard } from '../dashboards/block-pool/block-pool-dashboard';
import { CEPH_STORAGE_NAMESPACE } from '../../constants';
import { CephBlockPoolModel } from '../../models';

const BlockPoolIcon: React.FC<BlockPoolIconProps> = ({ name, kind }) => {
  return (
    <span data-test="block-pool-icon">
      <ResourceIcon kind={kind} />
      {name}
    </span>
  );
};

const BlockPoolDetailsPage: React.FC = (props) => {
  const { poolName } = useParams();
  const { editYaml } = navFactory;
  const { t } = useTranslation();
  const location = useLocation();
  const kind = referenceForModel(CephBlockPoolModel);

  const [cephClusters] = useK8sWatchResource<CephClusterKind[]>(cephClusterResource);

  // Overview page and YAML page
  const pagesFor = React.useCallback(
    () => [
      {
        href: '',
        // t('ceph-storage-plugin~Overview')
        nameKey: 'ceph-storage-plugin~Overview',
        component: BlockPoolDashboard,
      },
      editYaml(),
    ],
    [editYaml],
  );

  const breadcrumbs = () => [
    {
      name: t('ceph-storage-plugin~StorageSystems'),
      path: '/odf/systems',
    },
    {
      name: t('ceph-storage-plugin~StorageSystem details'),
      path: location.pathname.split(`/${poolName}`)[0],
    },
    {
      name: poolName,
      path: '',
    },
  ];

  return (
    <DetailsPage
      {...props}
      name={poolName}
      namespace={CEPH_STORAGE_NAMESPACE}
      kind={kind}
      kindObj={CephBlockPoolModel}
      menuActions={menuActionCreator}
      pagesFor={pagesFor}
      breadcrumbsFor={breadcrumbs}
      icon={() => <BlockPoolIcon name={poolName} kind={kind} />}
      customData={{ tFunction: t, cephCluster: cephClusters?.[0] }}
    />
  );
};

type BlockPoolIconProps = {
  name: string;
  kind: string;
};

export default BlockPoolDetailsPage;
