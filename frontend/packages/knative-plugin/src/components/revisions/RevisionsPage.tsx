import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { RevisionModel } from '../../models';
import RevisionList from './RevisionList';

const RevisionsPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('knative-plugin~Revisions')}</title>
      </Helmet>
      <ListPage
        {...props}
        canCreate={false}
        kind={referenceForModel(RevisionModel)}
        ListComponent={RevisionList}
      />
    </>
  );
};

export default RevisionsPage;
