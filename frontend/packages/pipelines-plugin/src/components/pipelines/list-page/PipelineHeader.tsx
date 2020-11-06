import { TFunction } from 'i18next';
import { sortable } from '@patternfly/react-table';
import { tableColumnClasses } from './pipeline-table';

const PipelineHeader = (t: TFunction) => () => {
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
      title: t('pipelines-plugin~Last Run'),
      sortField: 'latestRun.metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('pipelines-plugin~Task Status'),
      sortField: 'latestRun.status.succeededCondition',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('pipelines-plugin~Last Run Status'),
      sortField: 'latestRun.status.succeededCondition',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: t('pipelines-plugin~Last Run Time'),
      sortField: 'latestRun.status.completionTime',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[6] },
    },
  ];
};

export default PipelineHeader;
