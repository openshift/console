import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { match as Rmatch } from 'react-router-dom';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { useAccessReview } from '@console/dynamic-plugin-sdk';
import { DefaultPage } from '@console/internal/components/default-resource';
import { Page } from '@console/internal/components/utils';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { SecretModel } from '@console/internal/models';
import { referenceForModel, SecretKind } from '@console/internal/module/k8s';
import {
  MenuAction,
  MenuActions,
  MultiTabListPage,
  SecondaryButtonAction,
  useFlag,
} from '@console/shared';
import { FLAG_OPENSHIFT_PIPELINE_AS_CODE, FLAG_OPENSHIFT_PIPELINE_CONDITION } from '../../const';
import { PipelineModel, ConditionModel, PipelineRunModel, RepositoryModel } from '../../models';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';
import { PAC_SECRET_NAME } from '../pac/const';
import PipelineRunsResourceList from '../pipelineruns/PipelineRunsResourceList';
import { PIPELINE_NAMESPACE } from '../pipelines/const';
import PipelinesList from '../pipelines/list-page/PipelinesList';
import RepositoriesList from '../repository/list-page/RepositoriesList';

interface PipelinesListPageProps {
  match: Rmatch<any>;
}

const PipelinesListPage: React.FC<PipelinesListPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const isRepositoryEnabled = useFlag(FLAG_OPENSHIFT_PIPELINE_AS_CODE);
  const isConditionsEnabled = useFlag(FLAG_OPENSHIFT_PIPELINE_CONDITION);
  const {
    params: { ns: namespace },
  } = match;
  const badge = usePipelineTechPreviewBadge(namespace);
  const [hasCreateAccess, hasCreateAccessLoading] = useAccessReview({
    namespace: PIPELINE_NAMESPACE,
    verb: 'create',
    resource: 'secrets',
  });
  const [pacSecretData, pacSecretDataLoaded, pacSecretDataError] = useK8sGet<SecretKind>(
    SecretModel,
    PAC_SECRET_NAME,
    PIPELINE_NAMESPACE,
  );
  const [showTitle, hideBadge, canCreate] = [false, true, false];
  const menuActions: MenuActions = {
    pipeline: {
      model: PipelineModel,
      onSelection: (key: string, action: MenuAction, url: string) => `${url}/builder`,
    },
    pipelineRun: { model: PipelineRunModel },
    ...(isConditionsEnabled ? { condition: { model: ConditionModel } } : {}),
    ...(isRepositoryEnabled
      ? {
          repository: {
            model: RepositoryModel,
            onSelection: (_key: string, _action: MenuAction, url: string) => `${url}/form`,
          },
        }
      : {}),
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
    ...(isConditionsEnabled
      ? [
          {
            href: 'conditions',
            // t(ConditionModel.labelPluralKey)
            nameKey: ConditionModel.labelPluralKey,
            component: DefaultPage,
            pageData: {
              kind: referenceForModel(ConditionModel),
              canCreate,
              namespace,
              showTitle,
            },
          },
        ]
      : []),
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
  ];

  const secondaryButtonAction: SecondaryButtonAction = {
    href: `/pac/ns/${PIPELINE_NAMESPACE}`,
    label:
      pacSecretDataLoaded && !pacSecretDataError && pacSecretData
        ? t('pipelines-plugin~View GitHub App')
        : t('pipelines-plugin~Setup GitHub App'),
  };

  const showSecondaryAction = pacSecretDataLoaded && hasCreateAccess && !hasCreateAccessLoading;

  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      <MultiTabListPage
        pages={pages}
        match={match}
        title={t('pipelines-plugin~Pipelines')}
        badge={badge}
        menuActions={menuActions}
        secondaryButtonAction={showSecondaryAction ? secondaryButtonAction : undefined}
        telemetryPrefix="Pipelines"
      />
    </NamespacedPage>
  );
};

export default PipelinesListPage;
