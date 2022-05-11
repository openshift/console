import { sortable } from '@patternfly/react-table';
import i18n from '@console/internal/i18n';
import { GitOpsDeploymentHistoryTableColumnClasses } from './GitOpsDeploymentHistoryTableColumnClasses';

const GitOpsDeploymentHistoryTableHeader = () => {
  return [
    {
      title: i18n.t('gitops-plugin~Deployment Time'),
      sortField: 'deployed_at',
      transforms: [sortable],
      props: { className: GitOpsDeploymentHistoryTableColumnClasses[0] },
    },
    {
      title: i18n.t('gitops-plugin~Message'),
      sortField: 'message',
      transforms: [sortable],
      props: { className: GitOpsDeploymentHistoryTableColumnClasses[1] },
    },
    {
      title: i18n.t('gitops-plugin~Environment'),
      sortField: 'environment',
      transforms: [sortable],
      props: { className: GitOpsDeploymentHistoryTableColumnClasses[2] },
    },
    {
      title: i18n.t('gitops-plugin~Author'),
      sortField: 'author',
      transforms: [sortable],
      props: { className: GitOpsDeploymentHistoryTableColumnClasses[3] },
    },
    {
      title: i18n.t('gitops-plugin~Revision'),
      sortField: 'revision',
      transforms: [sortable],
      props: { className: GitOpsDeploymentHistoryTableColumnClasses[4] },
    },
  ];
};

export default GitOpsDeploymentHistoryTableHeader;
