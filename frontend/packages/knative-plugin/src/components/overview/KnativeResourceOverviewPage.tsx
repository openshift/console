import * as React from 'react';
import { connect } from 'react-redux';
import { Kebab, LoadingBox } from '@console/internal/components/utils';
import { ResourceOverviewDetails } from '@console/internal/components/overview/resource-overview-details';
import { groupVersionFor, K8sKind, referenceForModel } from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';
import { OverviewItem } from '@console/shared';
import { ModifyApplication } from '@console/dev-console/src/actions/modify-application';
import { KNATIVE_SERVING_APIGROUP } from '../../const';
import { RevisionModel, ServiceModel } from '../../models';
import { getRevisionActions } from '../../actions/getRevisionActions';
import { isDynamicEventResourceKind } from '../../utils/fetch-dynamic-eventsources-utils';
import OverviewDetailsKnativeResourcesTab from './OverviewDetailsKnativeResourcesTab';
import KnativeOverview from './KnativeOverview';

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
  if (kindsInFlight) {
    return !knativeModels ? null : <LoadingBox />;
  }
  const apiInfo = groupVersionFor(item.obj.apiVersion);
  const resourceModel = knativeModels.find(
    (model) =>
      model.kind === item.obj.kind &&
      model.apiGroup === apiInfo.group &&
      model.apiVersion === apiInfo.version,
  );

  const actions = [];
  if (resourceModel.kind === ServiceModel.kind) {
    actions.push(ModifyApplication);
  }
  if (resourceModel.kind === RevisionModel.kind) {
    actions.push(...getRevisionActions());
  } else {
    actions.push(...Kebab.getExtensionsActionsForKind(resourceModel), ...Kebab.factory.common);
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
          isDynamicEventResourceKind(referenceForModel(model)),
      ),
  };
};

export default connect(mapStateToProps)(KnativeResourceOverviewPage);
