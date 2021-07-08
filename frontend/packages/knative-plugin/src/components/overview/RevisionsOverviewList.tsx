import * as React from 'react';
import { Button } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { SidebarSectionHeading, useAccessReview } from '@console/internal/components/utils';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { ServiceModel, RevisionModel } from '../../models';
import { setTrafficDistributionModal } from '../modals';
import RevisionsOverviewListItem from './RevisionsOverviewListItem';
import './RevisionsOverviewList.scss';

export type RevisionsOverviewListProps = {
  revisions: K8sResourceKind[];
  service: K8sResourceKind;
};

const MAX_REVISIONS: number = 3;

const RevisionsOverviewList: React.FC<RevisionsOverviewListProps> = ({ revisions, service }) => {
  const { t } = useTranslation();
  const canSetTrafficDistribution = useAccessReview({
    group: ServiceModel.apiGroup,
    resource: ServiceModel.plural,
    namespace: service.metadata.namespace,
    verb: 'update',
  });

  const namespace = service.metadata?.namespace;
  const traffic = service.status?.traffic;
  const name = service.metadata?.name;

  const filteredRevisions = (): K8sResourceKind[] => {
    if (!revisions || !revisions.length) {
      return [];
    }
    const [revWithTraffic, revWithoutTraffic] = _.partition(revisions, (element) => {
      return traffic ? _.find(traffic, { revisionName: element.metadata?.name }) : false;
    }).map((element) => _.sortBy(element, ['metadata.creationTimestamp']));
    return revWithTraffic.length < MAX_REVISIONS
      ? _.concat(revWithTraffic, revWithoutTraffic.slice(0, MAX_REVISIONS - revWithTraffic.length))
      : revWithTraffic;
  };

  const getRevisionsLink = () => {
    const url = `/search/ns/${namespace}`;
    const searchQuery = `serving.knative.dev/service=${name}`;
    const params = new URLSearchParams();
    params.append('kind', referenceForModel(RevisionModel));
    params.append('q', searchQuery);
    return `${url}?${params.toString()}`;
  };

  return (
    <>
      <SidebarSectionHeading
        text={t('knative-plugin~Revisions')}
        className="revision-overview-list"
      >
        {revisions?.length > MAX_REVISIONS && (
          <Link className="sidebar__section-view-all" to={getRevisionsLink()}>
            {t('knative-plugin~View all ({{revLength}})', { revLength: revisions.length })}
          </Link>
        )}

        {canSetTrafficDistribution && (
          <Button
            variant="secondary"
            onClick={() => setTrafficDistributionModal({ obj: service })}
            isDisabled={!(revisions && revisions.length)}
          >
            {t('knative-plugin~Set traffic distribution')}
          </Button>
        )}
      </SidebarSectionHeading>
      {_.isEmpty(revisions) ? (
        <span className="text-muted">
          {t('knative-plugin~No Revisions found for this resource.')}
        </span>
      ) : (
        <ul className="list-group">
          {_.map(filteredRevisions(), (revision) => (
            <RevisionsOverviewListItem
              key={revision.metadata.uid}
              revision={revision}
              service={service}
            />
          ))}
        </ul>
      )}
    </>
  );
};

export default RevisionsOverviewList;
