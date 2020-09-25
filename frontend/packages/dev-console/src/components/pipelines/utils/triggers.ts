import * as React from 'react';
import { flatten, mapValues } from 'lodash';
import { RouteModel } from '@console/internal/models';
import { getRouteWebURL } from '@console/internal/components/routes';
import { K8sResourceCommon, referenceForModel, RouteKind } from '@console/internal/module/k8s';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import {
  useK8sWatchResource,
  useK8sWatchResources,
  WatchK8sResource,
  WatchK8sResources,
  WatchK8sResults,
  WatchK8sResultsObject,
} from '@console/internal/components/utils/k8s-watch-hook';
import { EventListenerModel, PipelineRunModel, TriggerTemplateModel } from '../../../models';
import { getResourceModelFromBindingKind, PipelineRun } from '../../../utils/pipeline-augment';
import {
  EventListenerKind,
  EventListenerKindTrigger,
  TriggerBindingKind,
  TriggerTemplateKind,
} from '../resource-types';
import { ResourceModelLink } from '../resource-overview/DynamicResourceLinkList';

type RouteMap = { [generatedName: string]: RouteKind };
type TriggerTemplateMapping = { [key: string]: TriggerTemplateKind };

const getResourceName = (resource: K8sResourceCommon): string => resource.metadata.name;
const getEventListenerTemplateNames = (el: EventListenerKind): string[] =>
  el.spec.triggers.map((elTrigger: EventListenerKindTrigger) => elTrigger.template.name);
const getEventListenerGeneratedName = (eventListener: EventListenerKind) =>
  eventListener.status?.configuration.generatedName;

const useEventListenerRoutes = (
  namespace: string,
  eventListenerResources: EventListenerKind[],
): RouteMap => {
  const memoResources: WatchK8sResources<RouteMap> = React.useMemo(() => {
    return (eventListenerResources || []).map(getEventListenerGeneratedName).reduce(
      (acc, generatedName) => ({
        ...acc,
        [generatedName]: {
          kind: RouteModel.kind,
          name: generatedName,
          namespace,
          optional: true,
        } as WatchK8sResource,
      }),
      {},
    );
  }, [namespace, eventListenerResources]);

  const results: WatchK8sResults<RouteMap> = useK8sWatchResources<RouteMap>(memoResources);

  return mapValues(results, (result: WatchK8sResultsObject<RouteKind>) => result.data);
};

const useAllEventListeners = (namespace: string) => {
  const eventListenerResource: WatchK8sResource = React.useMemo(
    () => ({
      kind: referenceForModel(EventListenerModel),
      isList: true,
      namespace,
    }),
    [namespace],
  );
  const [resources, eventListenerLoaded] = useK8sWatchResource<EventListenerKind[]>(
    eventListenerResource,
  );

  return eventListenerLoaded ? resources : null;
};

export type RouteTemplate = {
  routeURL: string | null;
  triggerTemplateName: string;
};

export const usePipelineTriggerTemplateNames = (
  pipelineName: string,
  namespace: string,
): RouteTemplate[] | null => {
  const eventListenerResources = useAllEventListeners(namespace);
  const triggerTemplateResources: WatchK8sResources<TriggerTemplateMapping> = React.useMemo(() => {
    if (!eventListenerResources) {
      return {};
    }
    return flatten(eventListenerResources.map(getEventListenerTemplateNames)).reduce(
      (resourceMap, triggerTemplateName: string) => ({
        ...resourceMap,
        [triggerTemplateName]: {
          kind: referenceForModel(TriggerTemplateModel),
          name: triggerTemplateName,
          namespace,
          optional: true,
        },
      }),
      {},
    );
  }, [namespace, eventListenerResources]);
  const triggerTemplates: WatchK8sResults<TriggerTemplateMapping> = useK8sWatchResources(
    triggerTemplateResources,
  );
  const routes: RouteMap = useEventListenerRoutes(namespace, eventListenerResources);

  const triggerTemplateResults: WatchK8sResultsObject<TriggerTemplateKind>[] = Object.values(
    triggerTemplates,
  );
  const countExpected = Object.keys(triggerTemplateResources).length;
  const countLoaded = triggerTemplateResults.filter(({ loaded }) => loaded).length;
  const countErrored = triggerTemplateResults.filter(({ loadError }) => !!loadError).length;
  if (countLoaded === 0 || countLoaded !== countExpected - countErrored) {
    return null;
  }
  const matchingTriggerTemplateNames: string[] = triggerTemplateResults
    .filter((resourceWatch) => resourceWatch.loaded)
    .map((resourceWatch) => resourceWatch.data)
    .filter((triggerTemplate: TriggerTemplateKind) => {
      const plr: PipelineRun = triggerTemplate?.spec?.resourcetemplates?.find(
        ({ kind }) => kind === PipelineRunModel.kind,
      );
      return plr?.spec?.pipelineRef?.name === pipelineName;
    })
    .map(getResourceName);

  return (eventListenerResources || []).reduce((acc, ev: EventListenerKind) => {
    const eventListenerTemplateNames = getEventListenerTemplateNames(ev);
    const generatedRouteName = getEventListenerGeneratedName(ev);

    const triggerTemplateName = matchingTriggerTemplateNames.find((name) =>
      eventListenerTemplateNames.includes(name),
    );
    const route: RouteKind = routes[generatedRouteName];

    if (!triggerTemplateName) {
      return acc;
    }

    let routeURL = null;
    try {
      if (route) {
        routeURL = getRouteWebURL(route);
      }
    } catch (e) {
      // swallow errors, we don't care if we can't create a good route right now
    }

    return [...acc, { routeURL, triggerTemplateName }];
  }, []);
};

export const useEventListenerTriggerTemplateNames = (
  eventListener: EventListenerKind,
): RouteTemplate[] | null => {
  const {
    metadata: { namespace },
  } = eventListener;

  const [route, routeLoaded] = useK8sGet<RouteKind>(
    RouteModel,
    getEventListenerGeneratedName(eventListener),
    namespace,
  );
  return eventListener.spec.triggers.reduce(
    (acc, trigger) => [
      ...acc,
      {
        routeURL: route && route?.status?.ingress && routeLoaded ? getRouteWebURL(route) : null,
        triggerTemplateName: trigger.template.name,
      },
    ],
    [],
  );
};

export const getEventListenerTriggerBindingNames = (
  eventListener: EventListenerKind,
): ResourceModelLink[] => {
  return eventListener.spec.triggers.reduce(
    (acc, trigger) => [
      ...acc,
      ...trigger.bindings.map((binding) => ({
        model: getResourceModelFromBindingKind(binding.kind),
        // Ref is used since Tekton Triggers 0.5 (OpenShift Pipeline Operator 1.1)
        // We keep the fallback to name here to support also OpenShift Pipeline Operator 1.0.
        name: binding.ref || binding.name,
      })),
    ],
    [] as ResourceModelLink[],
  );
};

export const getTriggerTemplatePipelineName = (triggerTemplate: TriggerTemplateKind): string => {
  return (
    triggerTemplate.spec.resourcetemplates.find(({ kind }) => kind === PipelineRunModel.kind)?.spec
      .pipelineRef.name || ''
  );
};

export const useTriggerTemplateEventListenerNames = (triggerTemplate: TriggerTemplateKind) => {
  const eventListenerResources = useAllEventListeners(triggerTemplate.metadata.namespace) || [];

  return eventListenerResources
    .filter((eventListener: EventListenerKind) =>
      eventListener.spec.triggers.find(
        ({ template: { name } }) => name === getResourceName(triggerTemplate),
      ),
    )
    .map(getResourceName);
};

export const useTriggerBindingEventListenerNames = (triggerBinding: TriggerBindingKind) => {
  const eventListenerResources = useAllEventListeners(triggerBinding.metadata.namespace) || [];
  return eventListenerResources
    .filter((eventListener: EventListenerKind) =>
      eventListener.spec.triggers.find(({ bindings }) =>
        bindings.find(
          ({ kind, name }) =>
            getResourceName(triggerBinding) === name &&
            getResourceModelFromBindingKind(kind).kind === triggerBinding.kind,
        ),
      ),
    )
    .map(getResourceName);
};
