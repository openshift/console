import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router-dom';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import CreateProjectListPage from '@console/dev-console/src/components/projects/CreateProjectListPage';
import { useFlag } from '@console/dynamic-plugin-sdk';
import { withStartGuide } from '@console/internal/components/start-guide';
import { Page } from '@console/internal/components/utils';
import { MenuAction, MenuActions, MultiTabListPage } from '@console/shared';
import { FLAG_OPENSHIFT_PIPELINE_AS_CODE } from '../../const';
import { PipelineModel, RepositoryModel } from '../../models';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';
import RepositoriesList from '../repository/list-page/RepositoriesList';
import PipelinesList from './list-page/PipelinesList';
import { PipelinesPage } from './PipelinesPage';

type PipelineTabbedPageProps = RouteComponentProps<{ ns: string }>;

export const PageContents: React.FC<PipelineTabbedPageProps> = (props) => {
  const { t } = useTranslation();
  const {
    match: {
      params: { ns: namespace },
    },
  } = props;
  const badge = usePipelineTechPreviewBadge(namespace);
  const isRepositoryEnabled = useFlag(FLAG_OPENSHIFT_PIPELINE_AS_CODE);
  const [showTitle, hideBadge, canCreate] = [false, true, false];
  const menuActions: MenuActions = {
    pipeline: {
      model: PipelineModel,
      onSelection: (key: string, action: MenuAction, url: string) => `${url}/builder`,
    },
    repository: { model: RepositoryModel },
  };
  const pages: Page[] = [
    {
      href: '',
      name: t(PipelineModel.labelPluralKey),
      component: PipelinesList,
    },
    {
      href: 'repositories',
      name: t(RepositoryModel.labelPluralKey),
      component: RepositoriesList,
      pageData: { showTitle, hideBadge, canCreate },
    },
  ];

  return namespace ? (
    isRepositoryEnabled ? (
      <MultiTabListPage
        pages={pages}
        match={props.match}
        title={t('pipelines-plugin~Pipelines')}
        badge={badge}
        menuActions={menuActions}
      />
    ) : (
      <PipelinesPage {...props} />
    )
  ) : (
    <CreateProjectListPage title={t('pipelines-plugin~Pipelines')}>
      {(openProjectModal) => (
        <Trans t={t} ns="pipelines-plugin">
          Select a Project to view its details or{' '}
          <Button isInline variant="link" onClick={openProjectModal}>
            create a Project
          </Button>
          .
        </Trans>
      )}
    </CreateProjectListPage>
  );
};

const PageContentsWithStartGuide = withStartGuide(PageContents);

const PipelineTabbedPage: React.FC<PipelineTabbedPageProps> = (props) => {
  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      <PageContentsWithStartGuide {...props} />
    </NamespacedPage>
  );
};

export default PipelineTabbedPage;
