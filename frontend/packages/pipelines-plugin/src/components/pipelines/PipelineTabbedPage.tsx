import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom-v5-compat';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import CreateProjectListPage, {
  CreateAProjectButton,
} from '@console/dev-console/src/components/projects/CreateProjectListPage';
import { withStartGuide } from '@console/internal/components/start-guide';
import { Page } from '@console/internal/components/utils';
import {
  MenuAction,
  MenuActions,
  MultiTabListPage,
  useFlag,
  useUserSettings,
} from '@console/shared';
import {
  FLAG_OPENSHIFT_PIPELINE_APPROVAL_TASK,
  FLAG_OPENSHIFT_PIPELINE_AS_CODE,
  PREFERRED_DEV_PIPELINE_PAGE_TAB_USER_SETTING_KEY,
} from '../../const';
import { PipelineModel, PipelineRunModel, RepositoryModel } from '../../models';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';
import { PipelineRunsResourceList } from '../pipelineruns';
import RepositoriesList from '../repository/list-page/RepositoriesList';
import ApprovalTasksListPage from '../tasks/list-page/approval-tasks/ApprovalTasksListPage';
import PipelinesList from './list-page/PipelinesList';

export const PageContents: React.FC = () => {
  const { t } = useTranslation();
  const { ns: namespace } = useParams();
  const navigate = useNavigate();
  const badge = usePipelineTechPreviewBadge(namespace);
  const isRepositoryEnabled = useFlag(FLAG_OPENSHIFT_PIPELINE_AS_CODE);
  const isApprovalTaskEnabled = useFlag(FLAG_OPENSHIFT_PIPELINE_APPROVAL_TASK);
  const [preferredTab, , preferredTabLoaded] = useUserSettings<string>(
    PREFERRED_DEV_PIPELINE_PAGE_TAB_USER_SETTING_KEY,
    'pipelines',
  );

  React.useEffect(() => {
    if (preferredTabLoaded && namespace) {
      if (isRepositoryEnabled && preferredTab === 'repositories') {
        navigate(`/dev-pipelines/ns/${namespace}/repositories`, { replace: true });
      }
      if (preferredTab === 'pipeline-runs') {
        navigate(`/dev-pipelines/ns/${namespace}/pipeline-runs`, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRepositoryEnabled, namespace, preferredTab, preferredTabLoaded]);

  const [showTitle, hideBadge, canCreate] = [false, true, false];
  const menuActions: MenuActions = {
    pipeline: {
      model: PipelineModel,
      onSelection: (key: string, action: MenuAction, url: string) => `${url}/builder`,
    },
    pipelineRun: { model: PipelineRunModel },
    repository: {
      model: RepositoryModel,
      onSelection: (_key: string, _action: MenuAction, url: string) => `${url}/form`,
    },
  };
  const pages: Page[] = [
    {
      href: '',
      // t(PipelineModel.labelPluralKey)
      nameKey: PipelineModel.labelPluralKey,
      component: PipelinesList,
    },
    {
      href: 'pipeline-runs',
      // t(PipelineRunModel.labelPluralKey)
      nameKey: PipelineRunModel.labelPluralKey,
      component: PipelineRunsResourceList,
      pageData: { showTitle, hideBadge, canCreate },
    },
    ...(isRepositoryEnabled
      ? [
          {
            href: 'repositories',
            // t(RepositoryModel.labelPluralKey)
            nameKey: RepositoryModel.labelPluralKey,
            component: RepositoriesList,
            pageData: { showTitle, hideBadge, canCreate },
          },
        ]
      : []),
    ...(isApprovalTaskEnabled
      ? [
          {
            href: 'approvals',
            // t(RepositoryModel.labelPluralKey)
            nameKey: `${t('pipelines-plugin~Approvals')}`,
            component: ApprovalTasksListPage,
            pageData: { showTitle, hideBadge, canCreate },
          },
        ]
      : []),
  ];

  return namespace ? (
    <MultiTabListPage
      pages={pages}
      title={t('pipelines-plugin~Pipelines')}
      badge={badge}
      menuActions={menuActions}
      telemetryPrefix="Pipelines"
    />
  ) : (
    <CreateProjectListPage title={t('pipelines-plugin~Pipelines')}>
      {(openProjectModal) => (
        <Trans t={t} ns="pipelines-plugin">
          Select a Project to view its details
          <CreateAProjectButton openProjectModal={openProjectModal} />.
        </Trans>
      )}
    </CreateProjectListPage>
  );
};

const PageContentsWithStartGuide = withStartGuide(PageContents);

const PipelineTabbedPage: React.FC = (props) => {
  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      <PageContentsWithStartGuide {...props} />
    </NamespacedPage>
  );
};

export default PipelineTabbedPage;
