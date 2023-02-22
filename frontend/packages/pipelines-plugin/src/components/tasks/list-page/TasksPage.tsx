import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { DefaultPage } from '@console/internal/components/default-resource';

const TasksPage = (props) => {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('pipelines-plugin~Tasks')}</title>
      </Helmet>
      <DefaultPage {...props} />
    </>
  );
};

export default TasksPage;
