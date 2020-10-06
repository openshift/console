import * as React from 'react';
import { match as Rmatch } from 'react-router-dom';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  PipelineModel,
  PipelineResourceModel,
  ConditionModel,
  PipelineRunModel,
} from '../../models';
import { Page } from '@console/internal/components/utils';
import { TechPreviewBadge, MenuAction, MenuActions, MultiTabListPage } from '@console/shared';
import PipelineRunsResourceList from '../pipelineruns/PipelineRunsResourceList';
import { DefaultPage } from '@console/internal/components/default-resource';
import PipelineResourcesListPage from '../pipeline-resources/list-page/PipelineResourcesListPage';
import PipelinesList from '../pipelines/list-page/PipelinesList';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';

interface PipelinesListPageProps {
  match: Rmatch<any>;
}

const PipelinesListPage: React.FC<PipelinesListPageProps> = ({ match }) => {
  const {
    params: { ns: namespace },
  } = match;
  const [showTitle, hideBadge, canCreate] = [false, true, false];
  const menuActions: MenuActions = {
    pipeline: {
      model: PipelineModel,
      onSelection: (key: string, action: MenuAction, url: string) => `${url}/builder`,
    },
    pipelineRun: { model: PipelineRunModel },
    pipelineResource: { model: PipelineResourceModel },
    condition: { model: ConditionModel },
  };
  const pages: Page[] = [
    {
      href: '',
      name: PipelineModel.labelPlural,
      component: PipelinesList,
    },
    {
      href: 'pipeline-runs',
      name: PipelineRunModel.labelPlural,
      component: PipelineRunsResourceList,
      pageData: { showTitle, hideBadge },
    },
    {
      href: 'pipeline-resources',
      name: PipelineResourceModel.labelPlural,
      component: PipelineResourcesListPage,
      pageData: { showTitle, hideBadge },
    },
    {
      href: 'conditions',
      name: ConditionModel.labelPlural,
      component: DefaultPage,
      pageData: {
        kind: referenceForModel(ConditionModel),
        canCreate,
        namespace,
        showTitle,
      },
    },
  ];

  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      <MultiTabListPage
        pages={pages}
        match={match}
        title="Pipelines"
        badge={<TechPreviewBadge />}
        menuActions={menuActions}
      />
    </NamespacedPage>
  );
};

export default PipelinesListPage;
