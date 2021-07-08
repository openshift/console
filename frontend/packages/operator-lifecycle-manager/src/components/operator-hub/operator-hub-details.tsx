import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import {
  navFactory,
  SectionHeading,
  ResourceSummary,
  Kebab,
  DetailsItem,
  useAccessReview,
} from '@console/internal/components/utils';
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
    <div className="co-m-pane__body">
      <SectionHeading text={t('olm~OperatorHub details')} />
      <div className="row">
        <div className="col-sm-6 col-xs-12">
          <ResourceSummary
            resource={operatorHub}
            podSelector="spec.podSelector"
            showNodeSelector={false}
          />
        </div>
        <div className="col-sm-6 col-xs-12">
          <div className="co-m-pane__details">
            <DetailsItem
              label={t('olm~Default sources')}
              obj={operatorHub}
              path="status.sources"
              canEdit={canEditDefaultSources}
              onEdit={() => editDefaultSourcesModal({ operatorHub })}
              editAsGroup
            >
              {operatorHub.status.sources
                .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
                .map((source, idx) => {
                  return (
                    <dl key={source.name}>
                      <DetailsItem
                        label={source.name}
                        obj={operatorHub}
                        path={`status.sources[${idx}]`}
                      >
                        <p data-test={`status_${source.name}`}>
                          {source.disabled ? t('public~Disabled') : t('public~Enabled')}
                        </p>
                      </DetailsItem>
                    </dl>
                  );
                })}
            </DetailsItem>
          </div>
        </div>
      </div>
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
      name: t('olm~Sources'),
      component: Sources,
    },
  ];
  return <DetailsPage {...props} menuActions={Kebab.factory.common} pages={pages} />;
};

type OperatorHubDetailsProps = {
  obj: OperatorHubKind;
};
