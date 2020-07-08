import * as React from 'react';
import * as _ from 'lodash';
import {
  K8sResourceKind,
  referenceForGroupVersionKind,
  groupVersionFor,
  PodKind,
} from '@console/internal/module/k8s';
import {
  ResourceLink,
  ExternalLink,
  SidebarSectionHeading,
} from '@console/internal/components/utils';
import { PodControllerOverviewItem } from '@console/shared';
import { PodModel } from '@console/internal/models';
import { PodsOverview } from '@console/internal/components/overview/pods-overview';

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
    kind,
    apiVersion,
    metadata: { name, namespace },
    spec,
    status,
  } = obj;
  const { name: sinkName, kind: sinkKind, apiVersion: sinkApiversion } =
    spec?.sink?.ref || spec?.sink || {};
  const sinkUri = status?.sinkUri;
  const deploymentData = current?.obj?.metadata?.ownerReferences?.[0];
  const apiGroup = apiVersion.split('/')[0];
  const linkUrl = `/search/ns/${namespace}?kind=${PodModel.kind}&q=${encodeURIComponent(
    `${apiGroup}/${_.lowerFirst(kind)}=${name}`,
  )}`;
  const { group, version } = (sinkApiversion && groupVersionFor(sinkApiversion)) || {};
  const isSinkReference = !!(sinkKind && sinkName && group && version);
  return (
    <>
      <SidebarSectionHeading text="Sink" />
      {isSinkReference || sinkUri ? (
        <ul className="list-group">
          <li className="list-group-item">
            {isSinkReference && (
              <ResourceLink
                kind={referenceForGroupVersionKind(group)(version)(sinkKind)}
                name={sinkName}
                namespace={namespace}
              />
            )}
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
        <span className="text-muted">No sink found for this resource.</span>
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
