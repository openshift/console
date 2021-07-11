import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { match as Rmatch } from 'react-router-dom';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { useFlag } from '@console/dynamic-plugin-sdk';
import { DefaultPage } from '@console/internal/components/default-resource';
import { Page } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { MenuAction, MenuActions, MultiTabListPage } from '@console/shared';
import { FLAG_OPENSHIFT_PIPELINE_AS_CODE } from '../../const';
import {
  PipelineModel,
  PipelineResourceModel,
  ConditionModel,
  PipelineRunModel,
  RepositoryModel,
} from '../../models';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';
import PipelineResourcesListPage from '../pipeline-resources/list-page/PipelineResourcesListPage';
import PipelineRunsResourceList from '../pipelineruns/PipelineRunsResourceList';
import PipelinesList from '../pipelines/list-page/PipelinesList';
import RepositoriesList from '../repository/list-page/RepositoriesList';

interface PipelinesListPageProps {
  match: Rmatch<any>;
}

const PipelinesListPage: React.FC<PipelinesListPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const isRepositoryEnabled = useFlag(FLAG_OPENSHIFT_PIPELINE_AS_CODE);
  const {
    params: { ns: namespace },
  } = match;
  const badge = usePipelineTechPreviewBadge(namespace);
  const [showTitle, hideBadge, canCreate] = [false, true, false];
  const menuActions: MenuActions = {
    pipeline: {
      model: PipelineModel,
      onSelection: (key: string, action: MenuAction, url: string) => `${url}/builder`,
    },
    pipelineRun: { model: PipelineRunModel },
    pipelineResource: { model: PipelineResourceModel },
    condition: { model: ConditionModel },
    ...(isRepositoryEnabled ? { repository: { model: RepositoryModel } } : {}),
  };
  const pages: Page[] = [
    {
      href: '',
      name: t(PipelineModel.labelPluralKey),
      component: PipelinesList,
    },
    {
      href: 'pipeline-runs',
      name: t(PipelineRunModel.labelPluralKey),
      component: PipelineRunsResourceList,
      pageData: { showTitle, hideBadge, canCreate },
    },
    {
      href: 'pipeline-resources',
      name: t(PipelineResourceModel.labelPluralKey),
      component: PipelineResourcesListPage,
      pageData: { showTitle, hideBadge },
    },
    {
      href: 'conditions',
      name: t(ConditionModel.labelPluralKey),
      component: DefaultPage,
      pageData: {
        kind: referenceForModel(ConditionModel),
        canCreate,
        namespace,
        showTitle,
      },
    },
    ...(isRepositoryEnabled
      ? [
          {
            href: 'repositories',
            name: t(RepositoryModel.labelPluralKey),
            component: RepositoriesList,
            pageData: { showTitle, hideBadge, canCreate },
          },
        ]
      : []),
  ];

  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      <MultiTabListPage
        pages={pages}
        match={match}
        title={t('pipelines-plugin~Pipelines')}
        badge={badge}
        menuActions={menuActions}
      />
    </NamespacedPage>
  );
};

export default PipelinesListPage;
