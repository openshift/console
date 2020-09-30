import * as React from 'react';
import { connect } from 'react-redux';
import { Kebab, LoadingBox } from '@console/internal/components/utils';
import { ResourceOverviewDetails } from '@console/internal/components/overview/resource-overview-details';
import { groupVersionFor, K8sKind, referenceForModel } from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';
import { OverviewItem } from '@console/shared';
import { ModifyApplication } from '@console/dev-console/src/actions/modify-application';
import {
  KNATIVE_SERVING_APIGROUP,
  KNATIVE_EVENT_MESSAGE_APIGROUP,
  KNATIVE_EVENTING_APIGROUP,
} from '../../const';
import { RevisionModel } from '../../models';
import { getRevisionActions } from '../../actions/getRevisionActions';
import { editSinkUri } from '../../actions/edit-sink-uri';
import {
  isDynamicEventResourceKind,
  isEventingChannelResourceKind,
  isEventingPubSubLinkKind,
} from '../../utils/fetch-dynamic-eventsources-utils';
import OverviewDetailsKnativeResourcesTab from './OverviewDetailsKnativeResourcesTab';
import KnativeOverview from './KnativeOverview';
import SinkUriResourcesTab from './SinkUriResourcesTab';
import { NodeType } from '../../topology/topology-types';

interface StateProps {
  kindsInFlight?: boolean;
  knativeModels?: K8sKind[];
}

export interface KnativeResourceOverviewPageProps extends StateProps {
  item?: OverviewItem;
}

const tabs = [
  {
    name: 'Details',
    component: KnativeOverview,
  },
  {
    name: 'Resources',
    component: OverviewDetailsKnativeResourcesTab,
  },
];

export const KnativeResourceOverviewPage: React.ComponentType<KnativeResourceOverviewPageProps> = ({
  item,
  knativeModels,
  kindsInFlight,
}: KnativeResourceOverviewPageProps) => {
  if (NodeType.SinkUri === item?.obj?.type?.nodeType) {
    return <SinkUriResourcesTab itemData={item} menuAction={editSinkUri} />;
  }
  if (kindsInFlight) {
    return !knativeModels ? null : <LoadingBox />;
  }
  const apiInfo = item?.obj && groupVersionFor(item.obj.apiVersion);
  const resourceModel =
    apiInfo &&
    knativeModels.find(
      (model) =>
        model.kind === item?.obj?.kind &&
        model.apiGroup === apiInfo.group &&
        model.apiVersion === apiInfo.version,
    );

  if (!resourceModel) {
    return null;
  }

  const actions = [];
  if (resourceModel.kind === RevisionModel.kind) {
    actions.push(...getRevisionActions());
  } else if (isEventingPubSubLinkKind(resourceModel.kind)) {
    actions.push(...Kebab.getExtensionsActionsForKind(resourceModel), ...Kebab.factory.common);
  } else {
    actions.push(
      ModifyApplication,
      ...Kebab.getExtensionsActionsForKind(resourceModel),
      ...Kebab.factory.common,
    );
  }

  return (
    <ResourceOverviewDetails
      item={item}
      kindObj={resourceModel}
      menuActions={actions}
      tabs={tabs}
    />
  );
};

const mapStateToProps = (state: RootState): StateProps => {
  return {
    kindsInFlight: state.k8s.getIn(['RESOURCES', 'inFlight']),
    knativeModels: state.k8s
      .getIn(['RESOURCES', 'models'])
      .filter(
        (model: K8sKind) =>
          model.apiGroup === KNATIVE_SERVING_APIGROUP ||
          model.apiGroup === KNATIVE_EVENTING_APIGROUP ||
          model.apiGroup === KNATIVE_EVENT_MESSAGE_APIGROUP ||
          isDynamicEventResourceKind(referenceForModel(model)) ||
          isEventingChannelResourceKind(referenceForModel(model)),
      ),
  };
};

export default connect(mapStateToProps)(KnativeResourceOverviewPage);
