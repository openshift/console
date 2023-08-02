import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { NamespaceBar } from '@console/internal/components/namespace-bar';
import { Page } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { MenuActions, MultiTabListPage } from '@console/shared';
import { ServiceModel, RevisionModel, RouteModel } from '../../../models';
import RevisionsPage from '../../revisions/RevisionsPage';
import RoutesPage from '../../routes/RoutesPage';
import ServicesPage from '../../services/ServicesPage';

const ServingListPage: React.FC = () => {
  const { t } = useTranslation();
  const { ns: namespace } = useParams();
  const [showTitle, canCreate] = [false, false];
  const menuActions: MenuActions = {
    service: { label: t('knative-plugin~Service'), model: ServiceModel },
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
        title={t('knative-plugin~Serving')}
        menuActions={menuActions}
        telemetryPrefix="Serving"
      />
    </>
  );
};

export default ServingListPage;
