import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { useLocation } from 'react-router-dom';

import { referenceForModel } from '@console/internal/module/k8s/k8s';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory, ResourceIcon } from '@console/internal/components/utils';

import { menuActionCreator } from './block-pool-menu-action';
import { BlockPoolDashboard } from '../dashboards/block-pool/block-pool-dashboard';
import { CEPH_STORAGE_NAMESPACE } from '../../constants';
import { CephBlockPoolModel } from '../../models';

const BlockPoolIcon: React.FC<BlockPoolIconProps> = ({ name, kind }) => {
  return (
    <span>
      <ResourceIcon kind={kind} />
      {name}
    </span>
  );
};

const BlockPoolDetailsPage: React.FC<BlockPoolDetailsPagePros> = (props) => {
  const { poolName } = props.match.params;
  const { editYaml } = navFactory;
  const { t } = useTranslation();
  const location = useLocation();
  const kind = referenceForModel(CephBlockPoolModel);

  // Overview page and YAML page
  const pagesFor = React.useCallback(
    () => [
      {
        href: '',
        name: t('ceph-storage-plugin~Overview'),
        component: BlockPoolDashboard,
      },
      editYaml(),
    ],
    [editYaml, t],
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
      match={props.match}
      name={poolName}
      namespace={CEPH_STORAGE_NAMESPACE}
      kind={kind}
      kindObj={CephBlockPoolModel}
      menuActions={menuActionCreator}
      pagesFor={pagesFor}
      customData={{ tFunction: t }}
      breadcrumbsFor={breadcrumbs}
      icon={() => <BlockPoolIcon name={poolName} kind={kind} />}
    />
  );
};

type BlockPoolIconProps = {
  name: string;
  kind: string;
};

type BlockPoolDetailsPagePros = RouteComponentProps<{ poolName: string }>;

export default BlockPoolDetailsPage;
