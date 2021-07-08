import { sortable } from '@patternfly/react-table';
import i18next from 'i18next';
import { tableColumnClasses } from './pipeline-resources-table';

const PipelineResourcesHeader = () => () => {
  return [
    {
      title: i18next.t('pipelines-plugin~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: i18next.t('pipelines-plugin~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
      id: 'namespace',
    },
    {
      title: i18next.t('pipelines-plugin~Type'),
      sortField: 'spec.type',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: i18next.t('pipelines-plugin~Created'),
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
