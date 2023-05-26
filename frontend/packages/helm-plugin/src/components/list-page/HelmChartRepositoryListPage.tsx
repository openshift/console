import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { HelmChartRepositoryModel } from '../../models';
import ProjectHelmChartRepositoryList from './ProjectHelmChartRepositoryList';

const HelmChartRepositoryListPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => {
  const { t } = useTranslation();
  const createProps = {
    to: `/ns/${
      props.namespace || 'default'
    }/helmchartrepositories/~new/form?kind=${referenceForModel(
      HelmChartRepositoryModel,
    )}&actionOrigin=search`,
  };
  return (
    <ListPage
      {...props}
      aria-label={t('helm-plugin~Helm Chart Repositories')}
      canCreate
      createProps={createProps}
      kind={referenceForModel(HelmChartRepositoryModel)}
      ListComponent={ProjectHelmChartRepositoryList}
    />
  );
};
export default HelmChartRepositoryListPage;
