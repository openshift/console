import * as React from 'react';
import * as _ from 'lodash';
import { K8sResourceKind, referenceForModel, PodKind } from '@console/internal/module/k8s';
import {
  ResourceLink,
  ExternalLink,
  SidebarSectionHeading,
} from '@console/internal/components/utils';
import { PodControllerOverviewItem } from '@console/shared';
import { PodModel } from '@console/internal/models';
import { PodsOverview } from '@console/internal/components/overview/pods-overview';
import { ServiceModel } from '@console/knative-plugin';

export type EventSinkServicesOverviewListProps = {
  obj: K8sResourceKind;
  pods?: PodKind[];
  current?: PodControllerOverviewItem;
};

const EventSinkServicesOverviewList: React.FC<EventSinkServicesOverviewListProps> = ({
  obj,
  pods,
  current,
}) => {
  const {
    kind: resKind,
    apiVersion,
    metadata: { name, namespace },
  } = obj;
  const sink = _.get(obj, 'spec.sink.ref') || _.get(obj, 'spec.sink');
  const sinkUri = obj?.status?.sinkUri;
  const deploymentData = current?.obj?.metadata?.ownerReferences?.[0];
  const apiGroup = apiVersion.split('/')[0];
  const linkUrl = `/search/ns/${namespace}?kind=${PodModel.kind}&q=${encodeURIComponent(
    `${apiGroup}/${_.lowerFirst(resKind)}=${name}`,
  )}`;
  return (
    <>
      <SidebarSectionHeading text="Knative Services" />
      {sink && sink.kind === ServiceModel.kind ? (
        <ul className="list-group">
          <li className="list-group-item">
            <ResourceLink
              kind={referenceForModel(ServiceModel)}
              name={sink.name}
              namespace={namespace}
            />
            {sinkUri && (
              <>
                <span className="text-muted">Sink URI: </span>
                <ExternalLink
                  href={sinkUri}
                  additionalClassName="co-external-link--block"
                  text={sinkUri}
                />
              </>
            )}
          </li>
        </ul>
      ) : (
        <span className="text-muted">No services found for this resource.</span>
      )}
      {pods?.length > 0 && <PodsOverview pods={pods} obj={obj} allPodsLink={linkUrl} />}
      {deploymentData?.name && (
        <>
          <SidebarSectionHeading text="Deployment" />
          <ul className="list-group">
            <li className="list-group-item">
              <ResourceLink
                kind={deploymentData.kind}
                name={deploymentData.name}
                namespace={namespace}
              />
            </li>
          </ul>
        </>
      )}
    </>
  );
};

export default EventSinkServicesOverviewList;
