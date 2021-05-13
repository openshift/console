import i18n from '@console/internal/i18n';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

const tableColumnClasses = [
  classNames('pf-m-width-20'), // Application name
  classNames('pf-m-width-40'), // Git repository
  classNames('pf-m-hidden', 'pf-m-visible-on-md', 'pf-m-width-20'), // Environments
  classNames('pf-m-hidden', 'pf-m-visible-on-lg', 'pf-m-width-20'), // Last deployment
];

const GitOpsTableHeader = () => {
  return [
    {
      title: i18n.t('gitops-plugin~Application name'),
      sortField: 'name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: i18n.t('gitops-plugin~Git repository'),
      sortField: 'gitRepository',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: i18n.t('gitops-plugin~Environments'),
      sortField: 'environments',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: i18n.t('gitops-plugin~Last deployment'),
      sortField: 'lastDeployment',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
  ];
};

export default GitOpsTableHeader;
