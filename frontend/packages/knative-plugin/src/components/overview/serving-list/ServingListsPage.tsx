import * as React from 'react';
import { match as Rmatch } from 'react-router-dom';
import { referenceForModel } from '@console/internal/module/k8s';
import { Page } from '@console/internal/components/utils';
import { NamespaceBar } from '@console/internal/components/namespace';
import { MenuActions, MultiTabListPage } from '@console/shared';
import { ServiceModel, RevisionModel, RouteModel } from '../../../models';
import ServicesPage from '../../services/ServicesPage';
import RevisionsPage from '../../revisions/RevisionsPage';
import RoutesPage from '../../routes/RoutesPage';

interface ServingListPageProps {
  match: Rmatch<{ ns: string }>;
}

const ServingListPage: React.FC<ServingListPageProps> = ({ match }) => {
  const {
    params: { ns: namespace },
  } = match;
  const [showTitle, canCreate] = [false, false];
  const menuActions: MenuActions = {
    service: { model: ServiceModel },
  };
  const pages: Page[] = [
    {
      href: '',
      name: ServiceModel.labelPlural,
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
      name: RevisionModel.labelPlural,
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
      name: RouteModel.labelPlural,
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
      <MultiTabListPage pages={pages} match={match} title="Serving" menuActions={menuActions} />
    </>
  );
};

export default ServingListPage;
