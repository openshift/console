import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import {
  navFactory,
  SectionHeading,
  ResourceSummary,
  Kebab,
} from '@console/internal/components/utils';
import { CatalogSourceListPage, CatalogSourceListPageProps } from '../catalog-source';
import { OperatorHubKind } from '.';
import { OperatorHubModel } from '../../models';

const OperatorHubDetails: React.FC<OperatorHubDetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  return (
    <div className="co-m-pane__body">
      <SectionHeading
        text={t('operator-hub-details~{{resource}} details', { resource: OperatorHubModel.label })}
      />
      <ResourceSummary resource={obj} podSelector="spec.podSelector" showNodeSelector={false} />
    </div>
  );
};

const Sources: React.FC<CatalogSourceListPageProps> = (props) => (
  <CatalogSourceListPage showTitle={false} {...props} />
);

export const OperatorHubDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { t } = useTranslation();
  const pages = [
    navFactory.details(OperatorHubDetails),
    navFactory.editYaml(),
    {
      href: 'sources',
      name: t('operator-hub-details~Sources'),
      component: Sources,
    },
  ];
  return <DetailsPage {...props} menuActions={Kebab.factory.common} pages={pages} />;
};

type OperatorHubDetailsProps = {
  obj: OperatorHubKind;
};
