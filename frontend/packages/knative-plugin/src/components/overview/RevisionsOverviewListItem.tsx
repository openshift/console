import type { FC } from 'react';
import { ChartLabel } from '@patternfly/react-charts/victory';
import { Grid, GridItem, ListItem } from '@patternfly/react-core';
import { ResourceLink } from '@console/internal/components/utils';
import type { K8sResourceKind, OwnerReference } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { PodStatus } from '@console/shared';
import { RevisionModel } from '../../models';
import { getTrafficByRevision } from '../../utils/get-knative-resources';
import { usePodsForRevisions } from '../../utils/usePodsForRevisions';
import RoutesUrlLink from './RoutesUrlLink';

import './RevisionsOverviewListItem.scss';

export type RevisionsOverviewListItemProps = {
  revision: K8sResourceKind;
  service: K8sResourceKind;
};

const RevisionsOverviewListItem: FC<RevisionsOverviewListItemProps> = ({ revision, service }) => {
  const {
    metadata: { name, namespace },
  } = revision;
  const { pods } = usePodsForRevisions(revision.metadata.uid, namespace);
  const current = pods?.[0];
  const deploymentData = current?.obj?.metadata.ownerReferences?.[0] || ({} as OwnerReference);
  const availableReplicas = current?.obj?.status?.availableReplicas || '0';
  const { urls = [], percent: trafficPercent } = getTrafficByRevision(name, service);
  return (
    <ListItem>
      <Grid hasGutter>
        <GridItem span={9} sm={8}>
          <ResourceLink kind={referenceForModel(RevisionModel)} name={name} namespace={namespace} />
        </GridItem>
        {trafficPercent && (
          <GridItem
            span={3}
            sm={4}
            className="pf-v6-u-text-align-right"
            data-test="revision-traffic-percent"
          >
            {trafficPercent}
          </GridItem>
        )}
      </Grid>
      {deploymentData.name && (
        <div className="odc-revision-deployment-list">
          <Grid hasGutter>
            <GridItem span={9} sm={8}>
              <ResourceLink
                kind={deploymentData.kind}
                name={deploymentData.name}
                namespace={namespace}
              />
            </GridItem>
            <GridItem span={3} sm={4}>
              <div className="odc-revision-deployment-list__pod">
                <PodStatus
                  standalone
                  data={current ? current.pods : []}
                  size={25}
                  innerRadius={8}
                  outerRadius={12}
                  title={availableReplicas}
                  titleComponent={<ChartLabel style={{ fontSize: '10px' }} />}
                  showTooltip={false}
                />
              </div>
            </GridItem>
          </Grid>
          {urls.length > 0 && (
            <Grid hasGutter>
              <GridItem>
                <RoutesUrlLink urls={urls} />
              </GridItem>
            </Grid>
          )}
        </div>
      )}
    </ListItem>
  );
};

export default RevisionsOverviewListItem;
