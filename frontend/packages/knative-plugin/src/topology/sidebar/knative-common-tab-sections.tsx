import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import {
  AdapterDataType,
  K8sResourceCommon,
  PodsAdapterDataType,
} from '@console/dynamic-plugin-sdk/src';
import { DetailsTabSectionCallback } from '@console/dynamic-plugin-sdk/src/extensions/topology-details';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { PodModel } from '@console/internal/models';
import { PodKind, podPhase, referenceForModel } from '@console/internal/module/k8s';
import { AllPodStatus } from '@console/shared/src';
import TopologySideBarTabSection from '@console/topology/src/components/side-bar/TopologySideBarTabSection';
import { getResource } from '@console/topology/src/utils';
import KSRoutesOverviewList from '../../components/overview/RoutesOverviewList';
import { RevisionModel } from '../../models';
import { RevisionKind } from '../../types';
import { usePodsForRevisions } from '../../utils/usePodsForRevisions';
import { TYPE_EVENT_PUB_SUB_LINK, TYPE_KNATIVE_SERVICE, TYPE_SINK_URI } from '../const';
import { NodeType } from '../topology-types';
import {
  KnativeOverviewDetails,
  EventSourcesOverviewList,
  KnativeEventSinkOverviewDetails,
} from './KnativeOverviewSections';

const usePodsAdapterForKnative = (resource: K8sResourceCommon): PodsAdapterDataType => {
  const { t } = useTranslation();
  const [rev, revisionLoaded, revisionErrorLoad] = useK8sWatchResource<RevisionKind[]>({
    kind: referenceForModel(RevisionModel),
    namespace: resource.metadata.namespace,
    isList: true,
  });

  const revisionIds = React.useMemo(() => {
    if (resource.kind === RevisionModel.kind) {
      return resource.metadata.uid;
    }
    if (revisionLoaded && !revisionErrorLoad && rev.length > 0) {
      const resouceRevisions = rev.filter(
        (r) => r.metadata.ownerReferences[0].name === resource.metadata.name,
      );
      return resouceRevisions.map((r) => r.metadata.uid).sort((a, b) => a.localeCompare(b));
    }
    return [];
  }, [revisionLoaded, revisionErrorLoad, rev, resource.kind, resource.metadata]);

  const { pods } = usePodsForRevisions(revisionIds, resource.metadata.namespace);
  const servicePods = React.useMemo(() => {
    return pods.reduce((acc, pod) => {
      if (pod.pods) {
        acc.push(...pod.pods.filter((p) => podPhase(p as PodKind) !== AllPodStatus.AutoScaledTo0));
      }
      return acc;
    }, []);
  }, [pods]);

  const linkUrl = `/search/ns/${resource.metadata.namespace}?kind=${
    PodModel.kind
  }&q=${encodeURIComponent(
    `serving.knative.dev/${resource.kind.toLowerCase()}=${resource.metadata.name}`,
  )}`;

  return React.useMemo(
    () => ({
      pods: servicePods,
      loaded: revisionLoaded,
      loadError: revisionErrorLoad,
      emptyText: t('knative-plugin~All Revisions are autoscaled to 0.'),
      allPodsLink: linkUrl,
    }),
    [servicePods, revisionLoaded, revisionErrorLoad, t, linkUrl],
  );
};

export const getKnativeSidepanelPodsAdapterSection = (
  element: GraphElement,
): AdapterDataType<PodsAdapterDataType> => {
  if (element.getType() === NodeType.KnService || element.getType() === NodeType.Revision) {
    const resource = getResource(element);
    return { resource, provider: usePodsAdapterForKnative };
  }
  return undefined;
};

export const getKnativeSidepanelDetailsTab: DetailsTabSectionCallback = (element: GraphElement) => {
  if (
    [
      TYPE_EVENT_PUB_SUB_LINK,
      NodeType.PubSub,
      NodeType.EventSource,
      NodeType.EventSourceKafka,
      NodeType.KnService,
      NodeType.Revision,
    ].includes(element.getType())
  ) {
    const knObj = element.getData().resources;
    const section = <KnativeOverviewDetails item={knObj} />;
    return [section, true, undefined];
  }
  return [undefined, true, undefined];
};

export const getKnativeSidePanelEventSinkDetailsTab: DetailsTabSectionCallback = (
  element: GraphElement,
) => {
  if (element.getType() === NodeType.EventSink) {
    const knObj = element.getData().resources;
    const section = <KnativeEventSinkOverviewDetails item={knObj} />;
    return [section, true, undefined];
  }
  return [undefined, true, undefined];
};

export const getKnativeSidepanelRoutesSection: DetailsTabSectionCallback = (
  element: GraphElement,
) => {
  if (element.getType() === NodeType.KnService || element.getType() === NodeType.Revision) {
    const knObj = element.getData().resources;
    const resource = getResource(element);
    const section = (
      <TopologySideBarTabSection>
        <KSRoutesOverviewList ksroutes={knObj.ksroutes} resource={resource} />
      </TopologySideBarTabSection>
    );
    return [section, true, undefined];
  }
  return [undefined, true, undefined];
};

export const getKnativeSidepanelEventSourcesSection: DetailsTabSectionCallback = (
  element: GraphElement,
) => {
  if (![TYPE_KNATIVE_SERVICE, TYPE_SINK_URI].includes(element.getType())) {
    return [undefined, true, undefined];
  }
  const knObj = element.getData().resources;
  const section = <EventSourcesOverviewList items={knObj.eventSources} />;
  return [section, true, undefined];
};
