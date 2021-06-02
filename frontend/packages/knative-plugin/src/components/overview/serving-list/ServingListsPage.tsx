import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { match as Rmatch } from 'react-router-dom';
import { NamespaceBar } from '@console/internal/components/namespace';
import { Page } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { MenuActions, MultiTabListPage } from '@console/shared';
import { ServiceModel, RevisionModel, RouteModel } from '../../../models';
import RevisionsPage from '../../revisions/RevisionsPage';
import RoutesPage from '../../routes/RoutesPage';
import ServicesPage from '../../services/ServicesPage';

interface ServingListPageProps {
  match: Rmatch<{ ns: string }>;
}

const ServingListPage: React.FC<ServingListPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const {
    params: { ns: namespace },
  } = match;
  const [showTitle, canCreate] = [false, false];
  const menuActions: MenuActions = {
    service: { label: t('knative-plugin~Service'), model: ServiceModel },
  };
  const pages: Page[] = [
    {
      href: '',
      name: t('knative-plugin~Services'),
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
      name: t('knative-plugin~Revisions'),
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
      name: t('knative-plugin~Routes'),
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
        match={match}
        title={t('knative-plugin~Serving')}
        menuActions={menuActions}
      />
    </>
  );
};

export default ServingListPage;
