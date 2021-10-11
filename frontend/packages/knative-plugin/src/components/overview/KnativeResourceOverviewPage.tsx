// remove this file after migrating all the knative sidepanels
import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { ResourceOverviewDetails } from '@console/internal/components/overview/resource-overview-details';
import { Kebab, LoadingBox } from '@console/internal/components/utils';
import { groupVersionFor, K8sKind, referenceForModel } from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';
import { OverviewItem } from '@console/shared';
import { ModifyApplication } from '@console/topology/src/actions';
import TopologySideBarContent from '@console/topology/src/components/side-bar/TopologySideBarContent';
import { editSinkUri } from '../../actions/edit-sink-uri';
import {
  KNATIVE_SERVING_APIGROUP,
  KNATIVE_EVENT_MESSAGE_APIGROUP,
  KNATIVE_EVENTING_APIGROUP,
  CAMEL_APIGROUP,
} from '../../const';
import { RevisionModel, ServiceModel } from '../../models';
import { URI_KIND } from '../../topology/const';
import { KnativeOverviewDetails } from '../../topology/sidebar/KnativeOverviewSections';
import {
  isDynamicEventResourceKind,
  isEventingChannelResourceKind,
  isEventingPubSubLinkKind,
} from '../../utils/fetch-dynamic-eventsources-utils';
import OverviewDetailsKnativeResourcesTab from './OverviewDetailsKnativeResourcesTab';
import SinkUriResourcesTab from './SinkUriResourcesTab';

interface StateProps {
  kindsInFlight?: boolean;
  knativeModels?: K8sKind[];
}

export interface KnativeResourceOverviewPageProps extends StateProps {
  item?: OverviewItem;
  element?: GraphElement;
}

export const KnativeResourceOverviewPage: React.ComponentType<KnativeResourceOverviewPageProps> = ({
  item,
  knativeModels,
  kindsInFlight,
  element,
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
      component: KnativeOverviewDetails,
    },
    {
      name: t('knative-plugin~Resources'),
      component: OverviewDetailsKnativeResourcesTab,
    },
  ];

  const actions = [];
  if (isEventingPubSubLinkKind(resourceModel.kind)) {
    actions.push(...Kebab.getExtensionsActionsForKind(resourceModel), ...Kebab.factory.common);
  } else {
    actions.push(
      ModifyApplication,
      ...Kebab.getExtensionsActionsForKind(resourceModel),
      ...Kebab.factory.common,
    );
  }

  if (resourceModel.kind === ServiceModel.kind || resourceModel.kind === RevisionModel.kind) {
    return <TopologySideBarContent element={element} />;
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
