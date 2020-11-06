import { TFunction } from 'i18next';
import { sortable } from '@patternfly/react-table';
import { tableColumnClasses } from './pipeline-resources-table';

const PipelineResourcesHeader = (t: TFunction) => () => {
  return [
    {
      title: t('pipelines-plugin~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('pipelines-plugin~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
      id: 'namespace',
    },
    {
      title: t('pipelines-plugin~Type'),
      sortField: 'spec.type',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('pipelines-plugin~Created'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[4] },
    },
  ];
};

export default PipelineResourcesHeader;
