import * as React from 'react';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import {
  navFactory,
  SectionHeading,
  ResourceSummary,
  Kebab,
} from '@console/internal/components/utils';
import { CatalogSourceListPage, CatalogSourceListPageProps } from '../catalog-source';
import { OperatorHubKind } from '.';

const OperatorHubDetails: React.FC<OperatorHubDetailsProps> = ({ obj }) => (
  <div className="co-m-pane__body">
    <SectionHeading text="OperatorHub Details" />
    <ResourceSummary resource={obj} podSelector="spec.podSelector" showNodeSelector={false} />
  </div>
);

const Sources: React.FC<CatalogSourceListPageProps> = (props) => (
  <CatalogSourceListPage showTitle={false} {...props} />
);
const pages = [
  navFactory.details(OperatorHubDetails),
  navFactory.editYaml(),
  {
    href: 'sources',
    name: 'Sources',
    component: Sources,
  },
];

export const OperatorHubDetailsPage: React.FC<DetailsPageProps> = (props) => {
  return <DetailsPage {...props} menuActions={[...Kebab.factory.common]} pages={pages} />;
};

type OperatorHubDetailsProps = {
  obj: OperatorHubKind;
};
