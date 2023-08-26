import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { useUserSettings } from '@console/shared/src';
import { PREFERRED_DEV_PIPELINE_PAGE_TAB_USER_SETTING_KEY } from '../../../const';
import { RepositoryModel } from '../../../models';
import RepositoryList from './ReppositoryList';

const RepositoriesList: React.FC<React.ComponentProps<typeof ListPage>> = (props) => {
  const { t } = useTranslation();
  const activePerspective = useActivePerspective()[0];
  const [, setPreferredTab, preferredTabLoaded] = useUserSettings<string>(
    PREFERRED_DEV_PIPELINE_PAGE_TAB_USER_SETTING_KEY,
    'pipelines',
  );

  React.useEffect(() => {
    if (preferredTabLoaded && activePerspective === 'dev') {
      setPreferredTab('repositories');
    }
  }, [activePerspective, preferredTabLoaded, setPreferredTab]);
  return (
    <>
      <Helmet>
        <title>{t('pipelines-plugin~Pipeline Repositories')}</title>
      </Helmet>
      <ListPage
        {...props}
        createProps={{
          to: `/k8s/ns/${props.namespace || 'default'}/${referenceForModel(
            RepositoryModel,
          )}/~new/form`,
        }}
        canCreate={props.canCreate ?? true}
        kind={referenceForModel(RepositoryModel)}
        ListComponent={RepositoryList}
      />
    </>
  );
};

export default RepositoriesList;
