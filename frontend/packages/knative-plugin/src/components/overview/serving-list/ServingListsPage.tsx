import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { NamespaceBar } from '@console/internal/components/namespace-bar';
import type { Page } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import type { MenuActions } from '@console/shared/src/components/multi-tab-list/multi-tab-list-page-types';
import { MultiTabListPage } from '@console/shared/src/components/multi-tab-list/MultiTabListPage';
import { ServiceModel, RevisionModel, RouteModel } from '../../../models';
import RevisionsPage from '../../revisions/RevisionsPage';
import RoutesPage from '../../routes/RoutesPage';
import ServicesPage from '../../services/ServicesPage';

const ServingListPage: FC = () => {
  const { t } = useTranslation('knative-plugin');
  const { ns: namespace } = useParams();
  const [showTitle, canCreate] = [false, false];
  const menuActions: MenuActions = {
    service: { label: t('Service'), model: ServiceModel },
  };
  const pages: Page[] = [
    {
      href: '',
      // t('knative-plugin~Services')
      nameKey: 'knative-plugin~Services',
      component: ServicesPage,
      pageData: {
        kind: referenceForModel(ServiceModel),
        canCreate,
        namespace,
        showTitle,
      },
    },
    {
      href: RevisionModel.plural,
      // t('knative-plugin~Revisions')
      nameKey: 'knative-plugin~Revisions',
      component: RevisionsPage,
      pageData: {
        kind: referenceForModel(RevisionModel),
        canCreate,
        namespace,
        showTitle,
      },
    },
    {
      href: RouteModel.plural,
      // t('knative-plugin~Routes')
      nameKey: 'knative-plugin~Routes',
      component: RoutesPage,
      pageData: {
        kind: referenceForModel(RouteModel),
        canCreate,
        namespace,
        showTitle,
      },
    },
  ];

  return (
    <>
      <NamespaceBar />
      <MultiTabListPage
        pages={pages}
        title={t('Serving')}
        menuActions={menuActions}
        telemetryPrefix="Serving"
      />
    </>
  );
};

export default ServingListPage;
