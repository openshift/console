import * as React from 'react';
import { connect } from 'react-redux';
import { Kebab, LoadingBox } from '@console/internal/components/utils';
import { ResourceOverviewDetails } from '@console/internal/components/overview/resource-overview-details';
import { groupVersionFor, K8sKind } from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';
import { OverviewItem } from '@console/shared';
import {
  KNATIVE_SERVING_APIGROUP,
  KNATIVE_EVENT_SOURCE_APIGROUP,
  KNATIVE_EVENT_SOURCE_APIGROUP_DEP,
} from '../../const';
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
  return (
    <ResourceOverviewDetails
      item={item}
      kindObj={resourceModel}
      menuActions={[...Kebab.getExtensionsActionsForKind(resourceModel), ...Kebab.factory.common]}
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
          model.apiGroup === KNATIVE_EVENT_SOURCE_APIGROUP ||
          model.apiGroup === KNATIVE_EVENT_SOURCE_APIGROUP_DEP,
      ),
  };
};

export default connect(mapStateToProps)(KnativeResourceOverviewPage);
