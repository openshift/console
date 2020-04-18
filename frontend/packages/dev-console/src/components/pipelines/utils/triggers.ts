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
import { Pipeline, PipelineRun } from '../../../utils/pipeline-augment';
import {
  EventListenerKind,
  EventListenerKindTrigger,
  TriggerBindingKind,
  TriggerTemplateKind,
} from '../resource-types';

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

const useAllEventListeners = (resource: K8sResourceCommon) => {
  const {
    metadata: { namespace },
  } = resource;
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

export const usePipelineTriggerTemplateNames = (pipeline: Pipeline): RouteTemplate[] | null => {
  const eventListenerResources = useAllEventListeners(pipeline);
  const {
    metadata: { namespace },
  } = pipeline;
  const triggerTemplateResources: WatchK8sResources<TriggerTemplateMapping> = React.useMemo(() => {
    if (!eventListenerResources) {
      return {};
    }
    return flatten(
      eventListenerResources.map((el: EventListenerKind) =>
        el.spec.triggers.map((elTrigger: EventListenerKindTrigger) => elTrigger.template.name),
      ),
    ).reduce(
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
      return plr?.spec?.pipelineRef?.name === getResourceName(pipeline);
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

  const generatedRouteName = eventListener.status.configuration.generatedName;
  const [route, routeLoaded] = useK8sGet<RouteKind>(RouteModel, generatedRouteName, namespace);
  return (eventListener.spec.triggers || []).reduce((acc, trigger) => {
    return [
      ...acc,
      {
        routeURL: route && routeLoaded ? getRouteWebURL(route) : null,
        triggerTemplateName: trigger.template.name,
      },
    ];
  }, []);
};

export const getEventListenerTriggerBindingNames = (
  eventListener: EventListenerKind,
): string[] | null => {
  const { bindings } = (eventListener.spec.triggers || []).reduce(
    (acc, trigger) => ({
      bindings: [...acc.bindings, ...trigger.bindings.map((binding) => binding.name)],
    }),
    { bindings: [] },
  );
  return [...bindings];
};

export const getTriggerTemplatePipelineName = (triggerTemplate: TriggerTemplateKind): string => {
  return (
    triggerTemplate.spec.resourcetemplates.find(({ kind }) => kind === PipelineRunModel.kind)?.spec
      .pipelineRef.name || ''
  );
};

export const useTriggerTemplateEventListenerNames = (triggerTemplate: TriggerTemplateKind) => {
  const eventListenerResources = useAllEventListeners(triggerTemplate) || [];

  return eventListenerResources
    .filter((eventListener: EventListenerKind) =>
      eventListener.spec.triggers.find(
        ({ template: { name } }) => name === getResourceName(triggerTemplate),
      ),
    )
    .map(getResourceName);
};

export const useTriggerBindingEventListenerNames = (triggerBinding: TriggerBindingKind) => {
  const eventListenerResources = useAllEventListeners(triggerBinding) || [];
  return eventListenerResources
    .filter((eventListener: EventListenerKind) =>
      eventListener.spec.triggers.find(({ bindings }) =>
        bindings.find(({ name }) => getResourceName(triggerBinding) === name),
      ),
    )
    .map(getResourceName);
};
