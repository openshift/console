import * as React from 'react';
import { match as Rmatch } from 'react-router-dom';
import MultiTabListPage from '../multi-tab-list/MultiTabListPage';
import { referenceForModel, K8sKind } from '@console/internal/module/k8s';
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
  const showTitle = false;
  const showBadge = false;
  const title = (
    <span style={{ display: 'flex', alignItems: 'flex-end' }}>
      Pipelines
      <span style={{ marginLeft: 'var(--pf-global--spacer--md)' }}>
        <TechPreviewBadge />
      </span>
    </span>
  );
  const createAction = (model: K8sKind, activeNamespace?: string) => {
    let action = {
      label: model.label,
      href: activeNamespace
        ? `/k8s/ns/${activeNamespace}/${referenceForModel(model)}/~new`
        : `/k8s/cluster/${referenceForModel(model)}/~new`,
    };
    if (model === PipelineModel) {
      const href = activeNamespace ? `${action.href}/builder` : action.href;
      action = {
        ...action,
        href,
      };
    }
    return action;
  };
  const menuActions = [
    createAction(PipelineModel, namespace),
    createAction(PipelineRunModel, namespace),
    createAction(PipelineResourceModel, namespace),
    createAction(ConditionModel, namespace),
  ];
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
      pageData: { showTitle, showBadge },
    },
    {
      href: '/pipeline-resources',
      name: PipelineResourceModel.labelPlural,
      component: PipelineResourcesListPage,
      pageData: { showTitle, showBadge },
    },
    {
      href: '/conditions',
      name: ConditionModel.labelPlural,
      component: DefaultPage,
      pageData: {
        kind: referenceForModel(ConditionModel),
        canCreate: false,
        namespace,
        showTitle,
      },
    },
  ];

  return <MultiTabListPage pages={pages} match={match} title={title} menuActions={menuActions} />;
};

export default PipelinesListPage;
