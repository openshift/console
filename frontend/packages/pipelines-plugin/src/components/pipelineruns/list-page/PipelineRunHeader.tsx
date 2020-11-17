import { TFunction } from 'i18next';
import { sortable } from '@patternfly/react-table';
import { tableColumnClasses } from './pipelinerun-table';

const PipelineRunHeader = (t: TFunction) => () => {
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
      title: t('pipelines-plugin~Status'),
      sortField: 'status.conditions[0].reason',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('pipelines-plugin~Task Status'),
      sortField: 'status.conditions[0].reason',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('pipelines-plugin~Started'),
      sortField: 'status.startTime',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: t('pipelines-plugin~Duration'),
      sortField: 'status.completionTime',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[6] },
    },
  ];
};

export default PipelineRunHeader;
