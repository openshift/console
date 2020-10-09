import { sortable } from '@patternfly/react-table';
import i18n from '@console/internal/i18n';
import { tableColumnClasses } from './pipeline-table';

const PipelineHeader = () => {
  return [
    {
      title: i18n.t('devconsole~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: i18n.t('devconsole~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
      id: 'namespace',
    },
    {
      title: i18n.t('devconsole~Last Run'),
      sortField: 'latestRun.metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: i18n.t('devconsole~Task Status'),
      sortField: 'latestRun.status.succeededCondition',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: i18n.t('devconsole~Last Run Status'),
      sortField: 'latestRun.status.succeededCondition',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: i18n.t('devconsole~Last Run Time'),
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
