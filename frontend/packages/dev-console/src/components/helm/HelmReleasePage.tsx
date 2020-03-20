import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import Helmet from 'react-helmet';
import { PageHeading, Firehose } from '@console/internal/components/utils';
import { SecretModel } from '@console/internal/models';
import ProjectListPage from '../projects/ProjectListPage';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import CustomResourceList from '../custom-resource-list/CustomResourceList';
import { getHelmReleases, helmRowFilters, getFilteredItems } from './helm-utils';
import HelmReleaseRow from './HelmReleaseRow';
import HelmReleaseHeader from './HelmReleaseHeader';

type HelmReleasePageProps = RouteComponentProps<{ ns: string }>;

export const HelmReleasePage: React.FC<HelmReleasePageProps> = (props) => {
  const {
    match: {
      params: { ns: namespace },
    },
  } = props;

  const resources = [
    {
      isList: true,
      namespace,
      kind: SecretModel.kind,
      prop: 'secrets',
      optional: true,
      selector: { owner: 'helm' },
    },
  ];
  return namespace ? (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      <Helmet>
        <title>Helm Releases</title>
      </Helmet>
      <PageHeading title="Helm Releases" />
      <Firehose resources={resources}>
        <CustomResourceList
          items={getHelmReleases(namespace)}
          queryArg="rowFilter-helm-release-status"
          rowFilters={helmRowFilters}
          getFilteredItems={getFilteredItems}
          resourceRow={HelmReleaseRow}
          resourceHeader={HelmReleaseHeader}
        />
      </Firehose>
    </NamespacedPage>
  ) : (
    <ProjectListPage title="Helm Releases">
      Select a project to view the list of Helm Releases
    </ProjectListPage>
  );
};

export default HelmReleasePage;
