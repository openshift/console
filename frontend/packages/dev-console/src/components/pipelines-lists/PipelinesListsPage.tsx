import * as React from 'react';
import { match as Rmatch } from 'react-router-dom';
import MultiTabListPage from '../multi-tab-list/MultiTabListPage';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  PipelineModel,
  PipelineResourceModel,
  ConditionModel,
  PipelineRunModel,
} from '../../models';
import { Page, Firehose } from '@console/internal/components/utils';
import { filters } from '../pipelines/list-page/PipelineAugmentRuns';
import PipelineAugmentRunsWrapper from '../pipelines/list-page/PipelineAugmentRunsWrapper';
import { TechPreviewBadge } from '@console/shared';
import PipelineRunsResourceList from '../pipelineruns/PipelineRunsResourceList';
import { DefaultPage } from '@console/internal/components/default-resource';
import PipelineResourcesListPage from '../pipeline-resources/list-page/PipelineResourcesListPage';
import { MenuAction, MenuActions } from '../multi-tab-list/multi-tab-list-page-types';

interface PipelinesListPageProps {
  match: Rmatch<any>;
}

export const PipelinesResourceList: React.FC<PipelinesListPageProps> = ({
  match: {
    params: { ns: namespace },
  },
}) => {
  const resources = [
    {
      isList: true,
      kind: referenceForModel(PipelineModel),
      namespace,
      prop: PipelineModel.id,
      filters: { ...filters },
    },
  ];
  return (
    <div className="co-m-pane__body">
      <Firehose resources={resources}>
        <PipelineAugmentRunsWrapper />
      </Firehose>
    </div>
  );
};

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
      component: PipelinesResourceList,
    },
    {
      href: '/pipeline-runs',
      name: PipelineRunModel.labelPlural,
      component: PipelineRunsResourceList,
      pageData: { showTitle, hideBadge },
    },
    {
      href: '/pipeline-resources',
      name: PipelineResourceModel.labelPlural,
      component: PipelineResourcesListPage,
      pageData: { showTitle, hideBadge },
    },
    {
      href: '/conditions',
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
    <MultiTabListPage
      pages={pages}
      match={match}
      title="Pipelines"
      badge={<TechPreviewBadge />}
      menuActions={menuActions}
    />
  );
};

export default PipelinesListPage;
