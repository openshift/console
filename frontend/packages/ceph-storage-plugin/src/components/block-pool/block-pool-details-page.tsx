import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { DetailsPage } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils';

import { PoolDashboard } from './dashbaord/pool-dashboard';
import { menuActionCreator } from './block-pool-menu-action';

const BlockPoolDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const { editYaml } = navFactory;
  const { t } = useTranslation();

  const pagesFor = React.useCallback(
    () => [
      {
        href: '',
        name: t('ceph-storage-plugin~Overview'),
        component: PoolDashboard,
      },
      editYaml(),
    ],
    [editYaml, t],
  );

  return <DetailsPage {...props} pagesFor={pagesFor} menuActions={menuActionCreator} />;
};

export default BlockPoolDetailsPage;
