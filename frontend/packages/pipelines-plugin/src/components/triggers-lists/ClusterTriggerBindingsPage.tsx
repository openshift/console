import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { DefaultPage } from '@console/internal/components/default-resource';

const ClusterTriggerBindingsPage = (props) => {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('pipelines-plugin~ClusterTriggerBindings')}</title>
      </Helmet>
      <DefaultPage {...props} />
    </>
  );
};

export default ClusterTriggerBindingsPage;
