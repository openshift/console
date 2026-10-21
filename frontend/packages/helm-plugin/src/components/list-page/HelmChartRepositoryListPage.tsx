import type { ComponentProps, FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { HelmChartRepositoryModel } from '../../models';
import ProjectHelmChartRepositoryList from './ProjectHelmChartRepositoryList';

const HelmChartRepositoryListPage: FC<ComponentProps<typeof ListPage>> = (props) => {
  const { t } = useTranslation();
  const createProps = {
    to: `/helm-repositories/ns/${props.namespace || 'default'}/~new/form?kind=${referenceForModel(
      HelmChartRepositoryModel,
    )}&actionOrigin=search`,
  };
  return (
    <ListPage
      {...props}
      aria-label={t('helm-plugin~HelmChartRepositories')}
      canCreate
      createProps={createProps}
      kind={referenceForModel(HelmChartRepositoryModel)}
      ListComponent={ProjectHelmChartRepositoryList}
      omitFilterToolbar
    />
  );
};
export default HelmChartRepositoryListPage;
