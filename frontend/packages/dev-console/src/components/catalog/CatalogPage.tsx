import * as React from 'react';
import Helmet from 'react-helmet';
import { RouteComponentProps } from 'react-router';
import { getQueryArgument } from '@console/internal/components/utils';
import CreateProjectListPage from '../projects/CreateProjectListPage';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import CatalogServiceProvider from './service/CatalogServiceProvider';
import CatalogController from './CatalogController';

type CatalogPageProps = RouteComponentProps<{
  ns?: string;
}>;

const CatalogPage: React.FC<CatalogPageProps> = ({ match }) => {
  const catalogType = getQueryArgument('catalogType');
  const namespace = match.params.ns;

  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      <Helmet>
        <title>Developer Catalog</title>
      </Helmet>
      {namespace ? (
        <CatalogServiceProvider namespace={namespace} catalogType={catalogType}>
          {(service) => <CatalogController {...service} />}
        </CatalogServiceProvider>
      ) : (
        <CreateProjectListPage title="Developer Catalog">
          Select a project to view the Developer Catalog
        </CreateProjectListPage>
      )}
    </NamespacedPage>
  );
};

export default CatalogPage;
