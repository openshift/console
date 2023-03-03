import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { match as Rmatch } from 'react-router-dom';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { Page } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { MultiTabListPage } from '@console/shared';
import {
  EventListenerModel,
  TriggerTemplateModel,
  TriggerBindingModel,
  ClusterTriggerBindingModel,
} from '../../models';
import { useTriggersTechPreviewBadge } from '../../utils/hooks';
import ClusterTriggerBindingsPage from './ClusterTriggerBindingsPage';
import EventListenersPage from './EventListnersPage';
import TriggerBindingsPage from './TriggerBindingsPage';
import TriggerTemplatesPage from './TriggerTemplatesPage';

interface TriggersPageProps {
  match: Rmatch<any>;
}

const TriggersPage: React.FC<TriggersPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const {
    params: { ns: namespace },
  } = match;
  const badge = useTriggersTechPreviewBadge(namespace);
  const [showTitle, canCreate] = [false, false];
  const menuActions = {
    eventListener: { model: EventListenerModel },
    triggerTemplate: { model: TriggerTemplateModel },
    triggerBinding: { model: TriggerBindingModel },
    clusterTriggerBinding: { model: ClusterTriggerBindingModel },
  };
  const pages: Page[] = [
    {
      href: '',
      name: t('pipelines-plugin~EventListeners'),
      component: EventListenersPage,
      pageData: {
        kind: referenceForModel(EventListenerModel),
        canCreate,
        namespace,
        showTitle,
      },
    },
    {
      href: 'trigger-templates',
      name: t('pipelines-plugin~TriggerTemplates'),
      component: TriggerTemplatesPage,
      pageData: {
        kind: referenceForModel(TriggerTemplateModel),
        canCreate,
        namespace,
        showTitle,
      },
    },
    {
      href: 'trigger-bindings',
      name: t('pipelines-plugin~TriggerBindings'),
      component: TriggerBindingsPage,
      pageData: {
        kind: referenceForModel(TriggerBindingModel),
        canCreate,
        namespace,
        showTitle,
      },
    },
    {
      href: 'cluster-trigger-bindings',
      name: t('pipelines-plugin~ClusterTriggerBindings'),
      component: ClusterTriggerBindingsPage,
      pageData: {
        kind: referenceForModel(ClusterTriggerBindingModel),
        canCreate,
        showTitle,
      },
    },
  ];

  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      <MultiTabListPage
        pages={pages}
        match={match}
        title={t('pipelines-plugin~Triggers')}
        badge={badge}
        menuActions={menuActions}
      />
    </NamespacedPage>
  );
};

export default TriggersPage;
