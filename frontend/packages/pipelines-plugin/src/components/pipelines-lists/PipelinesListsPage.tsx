import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { match as Rmatch } from 'react-router-dom';
import { referenceForModel } from '@console/internal/module/k8s';
import { Page } from '@console/internal/components/utils';
import { TechPreviewBadge, MenuAction, MenuActions, MultiTabListPage } from '@console/shared';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import {
  PipelineModel,
  PipelineResourceModel,
  ConditionModel,
  PipelineRunModel,
} from '../../models';
import PipelineRunsResourceList from '../pipelineruns/PipelineRunsResourceList';
import { DefaultPage } from '@console/internal/components/default-resource';
import PipelineResourcesListPage from '../pipeline-resources/list-page/PipelineResourcesListPage';
import PipelinesList from '../pipelines/list-page/PipelinesList';

interface PipelinesListPageProps {
  match: Rmatch<any>;
}

const PipelinesListPage: React.FC<PipelinesListPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const {
    params: { ns: namespace },
  } = match;
  const [showTitle, hideBadge, canCreate] = [false, true, false];
  const menuActions: MenuActions = {
    pipeline: {
      label: t('pipelines-plugin~Pipeline'),
      model: PipelineModel,
      onSelection: (key: string, action: MenuAction, url: string) => `${url}/builder`,
    },
    pipelineRun: { label: t('pipelines-plugin~Pipeline Run'), model: PipelineRunModel },
    pipelineResource: {
      label: t('pipelines-plugin~Pipeline Resource'),
      model: PipelineResourceModel,
    },
    condition: { label: t('pipelines-plugin~Condition'), model: ConditionModel },
  };
  const pages: Page[] = [
    {
      href: '',
      name: t('pipelines-plugin~Pipelines'),
      component: PipelinesList,
    },
    {
      href: 'pipeline-runs',
      name: t('pipelines-plugin~Pipeline Runs'),
      component: PipelineRunsResourceList,
      pageData: { showTitle, hideBadge, canCreate },
    },
    {
      href: 'pipeline-resources',
      name: t('pipelines-plugin~Pipeline Resources'),
      component: PipelineResourcesListPage,
      pageData: { showTitle, hideBadge },
    },
    {
      href: 'conditions',
      name: t('pipelines-plugin~Conditions'),
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
        title={t('pipelines-plugin~Pipelines')}
        badge={<TechPreviewBadge />}
        menuActions={menuActions}
      />
    </NamespacedPage>
  );
};

export default PipelinesListPage;
