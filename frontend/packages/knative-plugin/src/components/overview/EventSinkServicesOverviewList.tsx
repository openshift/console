import * as React from 'react';
import * as _ from 'lodash';
import { ListGroup } from 'patternfly-react';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import {
  ResourceLink,
  ExternalLink,
  SidebarSectionHeading,
} from '@console/internal/components/utils';
import { ServiceModel } from '@console/knative-plugin';

export type EventSinkServicesOverviewListProps = {
  obj: K8sResourceKind;
};

const EventSinkServicesOverviewList: React.FC<EventSinkServicesOverviewListProps> = ({ obj }) => {
  const sink = _.get(obj, 'spec.sink', null);
  const sinkUri = _.get(obj, 'status.sinkUri', null);
  const namespace = _.get(obj, 'metadata.namespace', null);
  return (
    <>
      <SidebarSectionHeading text="Knative Services" />
      {sink && sink.kind === ServiceModel.kind ? (
        <ListGroup componentClass="ul">
          <li className="list-group-item">
            <ResourceLink
              kind={referenceForModel(ServiceModel)}
              name={sink.name}
              namespace={namespace}
            />
            {sinkUri && (
              <>
                <span className="text-muted">Sink uri: </span>
                <ExternalLink
                  href={sinkUri}
                  additionalClassName="co-external-link--block"
                  text={sinkUri}
                />
              </>
            )}
          </li>
        </ListGroup>
      ) : (
        <span className="text-muted">No services found for this resource.</span>
      )}
    </>
  );
};

export default EventSinkServicesOverviewList;
