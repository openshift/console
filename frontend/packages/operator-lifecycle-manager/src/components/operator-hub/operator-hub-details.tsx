import * as React from 'react';
import { DescriptionList, Grid, GridItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import {
  navFactory,
  SectionHeading,
  ResourceSummary,
  DetailsItem,
  useAccessReview,
} from '@console/internal/components/utils';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { OperatorHubModel } from '../../models';
import { CatalogSourceListPage, CatalogSourceListPageProps } from '../catalog-source';
import { editDefaultSourcesModal } from '../modals/edit-default-sources-modal';
import { OperatorHubKind } from '.';

const OperatorHubDetails: React.FC<OperatorHubDetailsProps> = ({ obj: operatorHub }) => {
  const { t } = useTranslation();

  const canEditDefaultSources = useAccessReview({
    group: OperatorHubModel.apiGroup,
    resource: OperatorHubModel.plural,
    verb: 'patch',
  });

  return (
    <PaneBody>
      <SectionHeading text={t('olm~OperatorHub details')} />
      <Grid hasGutter>
        <GridItem sm={6}>
          <ResourceSummary
            resource={operatorHub}
            podSelector="spec.podSelector"
            showNodeSelector={false}
          />
        </GridItem>
        <GridItem sm={6}>
          <DescriptionList>
            <DetailsItem
              label={t('olm~Default sources')}
              obj={operatorHub}
              path="status.sources"
              canEdit={canEditDefaultSources}
              onEdit={() => editDefaultSourcesModal({ operatorHub })}
              editAsGroup
              hideEmpty
            >
              {operatorHub?.status?.sources
                .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
                .map((source, idx) => {
                  return (
                    <DescriptionList key={source.name}>
                      <DetailsItem
                        label={source.name}
                        obj={operatorHub}
                        path={`status.sources[${idx}]`}
                      >
                        <p data-test={`status_${source.name}`}>
                          {source.disabled ? t('public~Disabled') : t('public~Enabled')}
                        </p>
                      </DetailsItem>
                    </DescriptionList>
                  );
                })}
            </DetailsItem>
          </DescriptionList>
        </GridItem>
      </Grid>
    </PaneBody>
  );
};

const Sources: React.FC<CatalogSourceListPageProps> = (props) => (
  <CatalogSourceListPage showTitle={false} {...props} />
);

export const OperatorHubDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const pages = [
    navFactory.details(OperatorHubDetails),
    navFactory.editYaml(),
    {
      href: 'sources',
      // t('olm~Sources')
      nameKey: 'olm~Sources',
      component: Sources,
    },
  ];
  return <DetailsPage {...props} pages={pages} />;
};

type OperatorHubDetailsProps = {
  obj: OperatorHubKind;
};
