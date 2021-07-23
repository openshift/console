import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { DetailsPage } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils';

import { menuActionCreator } from './block-pool-menu-action';
import { BlockPoolDashboard } from '../dashboards/block-pool/block-pool-dashboard';

const BlockPoolDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const { editYaml } = navFactory;
  const { t } = useTranslation();

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

  return (
    <DetailsPage
      {...props}
      pagesFor={pagesFor}
      menuActions={menuActionCreator}
      customData={{ tFunction: t }}
    />
  );
};

export default BlockPoolDetailsPage;
