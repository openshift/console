import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { DetailsTabSectionExtensionHook } from '@console/dynamic-plugin-sdk/src/extensions/topology-details';
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

export const EventSinkSourceSection: React.FC<{ resource: K8sResourceKind }> = ({ resource }) => {
  const { t } = useTranslation();
  const target = resource?.spec?.source?.ref;
  const reference = target && referenceFor(target);
  const sinkUri = resource?.spec?.source?.uri;

  return (
    <>
      <SidebarSectionHeading text={t('knative-plugin~Source')} />
      {!reference && !sinkUri ? (
        <span data-test="event-sink-text" className="text-muted">
          {t('knative-plugin~No Source found for this resource.')}
        </span>
      ) : (
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
      )}
    </>
  );
};

export const useKnativeSidepanelEventSinkSection: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  if (element.getType() === NodeType.EventSink) {
    const resource = getResource(element);
    const section = resource ? (
      <TopologySideBarTabSection>
        <EventSinkSourceSection resource={resource} />
      </TopologySideBarTabSection>
    ) : null;
    return [section, true, undefined];
  }
  return [undefined, true, undefined];
};

export const usePodsForEventSink = (resource: K8sResourceKind, data) => {
  const { t } = useTranslation();
  const { revisions, associatedDeployment } = data;
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

export const usePodsForEventSource = (resource: K8sResourceKind, data) => {
  const { associatedDeployment } = data;
  const {
    podData: podsDeployment,
    loadError: loadErrorDeployment,
    loaded: loadedDeployment,
  } = usePodsWatcher(
    associatedDeployment,
    associatedDeployment?.kind ?? '',
    associatedDeployment?.metadata?.namespace || resource.metadata?.namespace,
  );

  return React.useMemo(
    () =>
      !associatedDeployment || Object.keys(associatedDeployment).length === 0
        ? null
        : {
            pods: podsDeployment?.pods ?? [],
            loaded: loadedDeployment,
            loadError: loadErrorDeployment,
          },
    [associatedDeployment, loadErrorDeployment, loadedDeployment, podsDeployment],
  );
};

export const getEventSinkPodsApdapter = (element: GraphElement) => {
  if (element.getType() === NodeType.EventSink) {
    const resource = getResource(element);
    const { revisions, associatedDeployment } = element.getData()?.resources;
    return {
      resource,
      provider: usePodsForEventSink,
      data: { revisions, associatedDeployment },
    };
  }
  return undefined;
};

export const getEventSourcePodsApdapter = (element: GraphElement) => {
  if (element.getType() === NodeType.EventSource) {
    const resource = getResource(element);
    const { associatedDeployment } = element.getData()?.resources;
    return {
      resource,
      provider: usePodsForEventSource,
      data: { associatedDeployment },
    };
  }
  return undefined;
};
