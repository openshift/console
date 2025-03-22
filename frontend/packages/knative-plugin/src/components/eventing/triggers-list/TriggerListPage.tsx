import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { EventingTriggerModel } from '../../../models';
import TriggerList from './TriggerList';

const TriggerListPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => {
  const { t } = useTranslation();
  return (
    <>
      <DocumentTitle>{t('knative-plugin~Triggers')}</DocumentTitle>
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
