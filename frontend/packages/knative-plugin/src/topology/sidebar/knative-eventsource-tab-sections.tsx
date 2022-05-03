import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { DetailsTabSectionExtensionHook } from '@console/dynamic-plugin-sdk/src/extensions/topology-details';
import { ExternalLink, ResourceIcon } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import TopologySideBarTabSection from '@console/topology/src/components/side-bar/TopologySideBarTabSection';
import { getResource } from '@console/topology/src/utils';
import {
  EventSourceDeployments,
  OwnedEventSources,
  EventSourceTarget,
} from '../../components/overview/EventSourceResources';
import { CamelKameletBindingModel } from '../../models';
import { isDynamicEventResourceKind } from '../../utils/fetch-dynamic-eventsources-utils';
import { TYPE_SINK_URI } from '../const';
import { KameletType } from '../topology-types';

export const useKnativeSidepanelSinkSection: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  const resource = getResource(element);
  const data = element.getData();
  if (!resource) {
    return [undefined, true, undefined];
  }
  if (
    isDynamicEventResourceKind(referenceFor(resource)) ||
    (resource.kind === CamelKameletBindingModel.kind &&
      data.data.kameletType === KameletType.Source)
  ) {
    const section = (
      <TopologySideBarTabSection>
        <EventSourceTarget obj={resource} />
      </TopologySideBarTabSection>
    );
    return [section, true, undefined];
  }
  return [undefined, true, undefined];
};

export const useKnativeSidepanelSinkAssociatedDeployment: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  const resource = getResource(element);
  const data = element.getData();
  if (!resource || !data?.resources) {
    return [undefined, true, undefined];
  }
  if (
    isDynamicEventResourceKind(referenceFor(resource)) ||
    (resource.kind === CamelKameletBindingModel.kind &&
      data.data.kameletType === KameletType.Source)
  ) {
    const section = (
      <TopologySideBarTabSection>
        <EventSourceDeployments
          data-test="event-source-deployments"
          deploymentObj={data.resources.associatedDeployment}
        />
      </TopologySideBarTabSection>
    );
    return [section, true, undefined];
  }
  return [undefined, true, undefined];
};

export const useKnativeSidepanelSinkEventSources: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  const resource = getResource(element);
  const data = element.getData();
  if (!resource || !data?.resources) {
    return [undefined, true, undefined];
  }
  if (
    isDynamicEventResourceKind(referenceFor(resource)) ||
    (resource.kind === CamelKameletBindingModel.kind &&
      data.data.kameletType === KameletType.Source)
  ) {
    const section = (
      <TopologySideBarTabSection>
        <OwnedEventSources eventSources={data.resources.eventSources} />
      </TopologySideBarTabSection>
    );
    return [section, true, undefined];
  }
  return [undefined, true, undefined];
};

export const getKnativeURISinkResourceLink = (element: GraphElement) => {
  if (element.getType() !== TYPE_SINK_URI) return undefined;
  const { obj } = element.getData().resources;
  const sinkUri = obj?.spec?.sinkUri;
  return (
    <>
      <ResourceIcon className="co-m-resource-icon--lg" kind={obj?.kind || 'Uri'} />
      <ExternalLink href={sinkUri} text={sinkUri} />
    </>
  );
};
