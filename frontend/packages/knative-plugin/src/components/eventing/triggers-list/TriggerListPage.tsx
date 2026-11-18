import type { ComponentProps, FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ListPage } from '@console/internal/components/factory/list-page';
import { referenceForModel } from '@console/internal/module/k8s/k8s-ref';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { EventingTriggerModel } from '../../../models';
import { TriggerList } from './TriggerList';

const TriggerListPage: FC<ComponentProps<typeof ListPage>> = (props) => {
  const { t } = useTranslation('knative-plugin');
  return (
    <>
      <DocumentTitle>{t('Triggers')}</DocumentTitle>
      <ListPage
        canCreate={false}
        {...props}
        kind={referenceForModel(EventingTriggerModel)}
        ListComponent={TriggerList}
        omitFilterToolbar
      />
    </>
  );
};

export default TriggerListPage;
