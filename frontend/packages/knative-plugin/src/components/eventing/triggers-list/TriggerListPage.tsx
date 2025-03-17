import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { Title } from '@console/shared/src/components/title/Title';
import { EventingTriggerModel } from '../../../models';
import TriggerList from './TriggerList';

const TriggerListPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => {
  const { t } = useTranslation();
  return (
    <>
      <Title>{t('knative-plugin~Triggers')}</Title>
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
