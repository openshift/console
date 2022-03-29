import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import {
  SidebarSectionHeading,
  ResourceLink,
  ExternalLink,
} from '@console/internal/components/utils';
import { K8sResourceKind, referenceFor, PodKind, podPhase } from '@console/internal/module/k8s';
import { AllPodStatus, usePodsWatcher } from '@console/shared';
import TopologySideBarTabSection from '@console/topology/src/components/side-bar/TopologySideBarTabSection';
import { getResource } from '@console/topology/src/utils';
import { usePodsForRevisions } from '../../utils/usePodsForRevisions';
import { NodeType } from '../topology-types';

export const EventSinkOutputTargetSection: React.FC<{ resource: K8sResourceKind }> = ({
  resource,
}) => {
  const { t } = useTranslation();
  const target = resource?.spec?.source?.ref;
  const reference = target && referenceFor(target);
  const sinkUri = resource?.spec?.source?.uri;

  if (!reference && !sinkUri) {
    return (
      <span data-test="event-sink-text" className="text-muted">
        {t('knative-plugin~No output target found for this resource.')}
      </span>
    );
  }
  return (
    <>
      <SidebarSectionHeading text={t('knative-plugin~Output Target')} />
      <ul className="list-group">
        <li className="list-group-item">
          {reference ? (
            <ResourceLink
              kind={reference}
              name={target.name}
              namespace={resource.metadata.namespace}
              dataTest="event-sink-sb-res"
            />
          ) : (
            <>
              <span data-test="event-sink-target-uri" className="text-muted">
                {t('knative-plugin~Target URI:')}{' '}
              </span>
              <ExternalLink
                href={sinkUri}
                additionalClassName="co-external-link--block"
                text={sinkUri}
              />
            </>
          )}
        </li>
      </ul>
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
  const { revisions, associatedDeployment = {} } = data;
  const { pods, loaded, loadError } = usePodsForRevisions(
    revisions?.map((r) => r.metadata.uid) ?? '',
    resource.metadata.namespace,
  );
  const {
    podData: podsDeployment,
    loadError: loadErrorDeployment,
    loaded: loadedDeployment,
  } = usePodsWatcher(
    associatedDeployment,
    associatedDeployment?.kind ?? '',
    associatedDeployment?.metadata?.namespace || resource.metadata?.namespace,
  );
  return React.useMemo(() => {
    if (!revisions) {
      return {
        pods: podsDeployment?.pods ?? [],
        loaded: loadedDeployment,
        loadError: loadErrorDeployment,
      };
    }
    return {
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
    };
  }, [
    loadError,
    loadErrorDeployment,
    loaded,
    loadedDeployment,
    pods,
    podsDeployment,
    revisions,
    t,
  ]);
};

export const getEventSinkPodsApdapter = (element: GraphElement) => {
  if (element.getType() === NodeType.EventSink) {
    const resource = getResource(element);
    const { revisions, associatedDeployment } = element.getData()?.resources;
    return { resource, provider: usePodsForEventSink, data: { revisions, associatedDeployment } };
  }
  return undefined;
};
