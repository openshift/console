import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { SidebarSectionHeading, ResourceLink } from '@console/internal/components/utils';
import { K8sResourceKind, referenceFor, PodKind, podPhase } from '@console/internal/module/k8s';
import { AllPodStatus } from '@console/shared/src';
import TopologySideBarTabSection from '@console/topology/src/components/side-bar/TopologySideBarTabSection';
import { getResource } from '@console/topology/src/utils';
import { usePodsForRevisions } from '../../utils/usePodsForRevisions';
import { NodeType } from '../topology-types';

export const EventSinkOutputTargetSection: React.FC<{ resource: K8sResourceKind }> = ({
  resource,
}) => {
  const { t } = useTranslation();
  const target = resource?.spec?.source?.ref;
  const reference = referenceFor(target);
  return (
    <>
      <SidebarSectionHeading text={t('knative-plugin~Output Target')} />
      {target ? (
        <ul className="list-group">
          <li className="list-group-item">
            {target && (
              <ResourceLink
                kind={reference}
                name={target.name}
                namespace={resource.metadata.namespace}
              />
            )}
          </li>
        </ul>
      ) : (
        <span className="text-muted">
          {t('knative-plugin~No output target found for this resource.')}
        </span>
      )}
    </>
  );
};

export const getKnativeSidepanelEventSinkSection = (element: GraphElement) => {
  if (element.getType() === NodeType.EventSink) {
    const resource = getResource(element);
    return resource ? (
      <TopologySideBarTabSection>
        <EventSinkOutputTargetSection resource={resource} />
      </TopologySideBarTabSection>
    ) : null;
  }
  return undefined;
};

export const usePodsForEventSink = (resource: K8sResourceKind, data) => {
  const { t } = useTranslation();
  const { pods, loaded, loadError } = usePodsForRevisions(
    data?.revisions.map((r) => r.metadata.uid) ?? '',
    resource.metadata.namespace,
  );
  return React.useMemo(
    () => ({
      pods: pods.reduce(
        (acc, currValue) => [
          ...acc,
          ...currValue.pods.filter((p) => podPhase(p as PodKind) !== AllPodStatus.AutoScaledTo0),
        ],
        [],
      ),
      emptyText: t('knative-plugin~All Revisions are autoscaled to 0.'),
      loaded,
      loadError,
    }),
    [loadError, loaded, pods, t],
  );
};

export const getEventSinkPodsApdapter = (element: GraphElement) => {
  if (element.getType() === NodeType.EventSink) {
    const resource = getResource(element);
    const resources = element.getData()?.resources;
    return { resource, provider: usePodsForEventSink, data: { revisions: resources.revisions } };
  }
  return undefined;
};
