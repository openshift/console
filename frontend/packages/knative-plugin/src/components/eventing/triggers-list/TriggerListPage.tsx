import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { EventingTriggerModel } from '../../../models';
import TriggerList from './TriggerList';

const TriggerListPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('knative-plugin~Triggers')}</title>
      </Helmet>
      <ListPage
        canCreate={false}
        {...props}
        kind={referenceForModel(EventingTriggerModel)}
        ListComponent={TriggerList}
      />
    </>
  );
};

export default TriggerListPage;
