import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { ResourceOverviewDetails } from '@console/internal/components/overview/resource-overview-details';
import { Kebab, LoadingBox } from '@console/internal/components/utils';
import { groupVersionFor, K8sKind, referenceForModel } from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';
import { OverviewItem } from '@console/shared';
import { ModifyApplication } from '@console/topology/src/actions';
import { editSinkUri } from '../../actions/edit-sink-uri';
import { getRevisionActions } from '../../actions/getRevisionActions';
import {
  KNATIVE_SERVING_APIGROUP,
  KNATIVE_EVENT_MESSAGE_APIGROUP,
  KNATIVE_EVENTING_APIGROUP,
  CAMEL_APIGROUP,
} from '../../const';
import { RevisionModel } from '../../models';
import { URI_KIND } from '../../topology/const';
import {
  isDynamicEventResourceKind,
  isEventingChannelResourceKind,
  isEventingPubSubLinkKind,
} from '../../utils/fetch-dynamic-eventsources-utils';
import KnativeOverview from './KnativeOverview';
import OverviewDetailsKnativeResourcesTab from './OverviewDetailsKnativeResourcesTab';
import SinkUriResourcesTab from './SinkUriResourcesTab';

interface StateProps {
  kindsInFlight?: boolean;
  knativeModels?: K8sKind[];
}

export interface KnativeResourceOverviewPageProps extends StateProps {
  item?: OverviewItem;
}

export const KnativeResourceOverviewPage: React.ComponentType<KnativeResourceOverviewPageProps> = ({
  item,
  knativeModels,
  kindsInFlight,
}: KnativeResourceOverviewPageProps) => {
  const { t } = useTranslation();

  if (item?.obj?.kind === URI_KIND) {
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

  const tabs = [
    {
      name: t('knative-plugin~Details'),
      component: KnativeOverview,
    },
    {
      name: t('knative-plugin~Resources'),
      component: OverviewDetailsKnativeResourcesTab,
    },
  ];

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
          model.apiGroup === CAMEL_APIGROUP ||
          isDynamicEventResourceKind(referenceForModel(model)) ||
          isEventingChannelResourceKind(referenceForModel(model)),
      ),
  };
};

export default connect(mapStateToProps)(KnativeResourceOverviewPage);
