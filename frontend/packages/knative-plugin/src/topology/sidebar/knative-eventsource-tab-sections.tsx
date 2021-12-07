import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { ExternalLink, ResourceIcon } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import TopologySideBarTabSection from '@console/topology/src/components/side-bar/TopologySideBarTabSection';
import { getResource } from '@console/topology/src/utils';
import EventSourceResources from '../../components/overview/EventSourceResources';
import { CamelKameletBindingModel } from '../../models';
import { isDynamicEventResourceKind } from '../../utils/fetch-dynamic-eventsources-utils';
import { TYPE_SINK_URI } from '../const';

export const getKnativeSidepanelSinkSection = (element: GraphElement) => {
  const resource = getResource(element);
  if (!resource) {
    return undefined;
  }
  if (
    isDynamicEventResourceKind(referenceFor(resource)) ||
    resource.kind === CamelKameletBindingModel.kind
  ) {
    return (
      <TopologySideBarTabSection>
        <EventSourceResources
          obj={resource}
          ownedSources={element.getData().resources.eventSources}
        />
      </TopologySideBarTabSection>
    );
  }
  return undefined;
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
