import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { RouteModel } from '../../models';
import RouteList from './RouteList';

const RoutesPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('knative-plugin~Routes')}</title>
      </Helmet>
      <ListPage
        {...props}
        canCreate={false}
        kind={referenceForModel(RouteModel)}
        ListComponent={RouteList}
      />
    </>
  );
};

export default RoutesPage;
