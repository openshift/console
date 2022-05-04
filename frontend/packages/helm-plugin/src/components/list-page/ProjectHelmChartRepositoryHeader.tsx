import { sortable } from '@patternfly/react-table';
import { TFunction } from 'i18next';
import { Kebab } from '@console/internal/components/utils';

const ProjectHelmChartRepositoryHeader = (t: TFunction) => () => {
  return [
    {
      title: t('helm-plugin~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
    },
    {
      title: t('helm-plugin~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
    },
    {
      title: t('helm-plugin~Created'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
    },
    {
      title: '',
      props: { className: Kebab.columnClass },
    },
  ];
};

export default ProjectHelmChartRepositoryHeader;
