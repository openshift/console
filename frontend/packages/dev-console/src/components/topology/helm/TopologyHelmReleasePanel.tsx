import * as React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import {
  navFactory,
  ResourceIcon,
  SimpleTabNav,
  StatusBox,
  ActionsMenu,
} from '@console/internal/components/utils';
import * as UIActions from '@console/internal/actions/ui';
import { Node } from '@patternfly/react-topology';
import HelmReleaseOverview from '../../helm/details/overview/HelmReleaseOverview';
import { helmReleaseActions } from './actions/helmReleaseActions';
import TopologyHelmReleaseResourcesPanel from './TopologyHelmReleaseResourcesPanel';
import TopologyHelmReleaseNotesPanel from './TopologyHelmReleaseNotesPanel';

type PropsFromState = {
  selectedDetailsTab?: any;
};

type PropsFromDispatch = {
  onClickTab?: (name: string) => void;
};

const stateToProps = ({ UI }): PropsFromState => ({
  selectedDetailsTab: UI.getIn(['overview', 'selectedDetailsTab']),
});

const dispatchToProps = (dispatch): PropsFromDispatch => ({
  onClickTab: (name) => dispatch(UIActions.selectOverviewDetailsTab(name)),
});

type OwnProps = {
  helmRelease: Node;
};

type TopologyHelmReleasePanelProps = PropsFromState & PropsFromDispatch & OwnProps;

export const ConnectedTopologyHelmReleasePanel: React.FC<TopologyHelmReleasePanelProps> = ({
  helmRelease,
  selectedDetailsTab,
  onClickTab,
}: TopologyHelmReleasePanelProps) => {
  const secret = helmRelease.getData().resources.obj;
  const { manifestResources, releaseNotes } = helmRelease.getData().data;
  const name = helmRelease.getLabel();
  const { namespace } = helmRelease.getData().groupResources[0].resources.obj.metadata;

  const detailsComponent = !secret
    ? () => (
        <StatusBox
          loaded
          loadError={{ message: `Unable to find resource for ${helmRelease.getLabel()}` }}
        />
      )
    : navFactory.details(HelmReleaseOverview).component;

  const resourcesComponent = () =>
    manifestResources ? (
      <TopologyHelmReleaseResourcesPanel
        manifestResources={manifestResources}
        releaseNamespace={namespace}
      />
    ) : null;

  const releaseNotesComponent = () => <TopologyHelmReleaseNotesPanel releaseNotes={releaseNotes} />;

  const actions = helmReleaseActions(helmRelease);
  return (
    <div className="overview__sidebar-pane resource-overview">
      <div className="overview__sidebar-pane-head resource-overview__heading">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            <ResourceIcon className="co-m-resource-icon--lg" kind="HelmRelease" />
            {name && (
              <Link
                to={`/helm-releases/ns/${namespace}/release/${name}`}
                className="co-resource-item__resource-name"
              >
                {name}
              </Link>
            )}
          </div>
          {actions?.length && (
            <div className="co-actions">
              <ActionsMenu actions={helmReleaseActions(helmRelease)} />
            </div>
          )}
        </h1>
      </div>
      <SimpleTabNav
        selectedTab={selectedDetailsTab || 'Resources'}
        onClickTab={onClickTab}
        tabs={[
          { name: 'Details', component: detailsComponent },
          { name: 'Resources', component: resourcesComponent },
          { name: 'Release Notes', component: releaseNotesComponent },
        ]}
        tabProps={{ obj: secret }}
        additionalClassNames="co-m-horizontal-nav__menu--within-sidebar co-m-horizontal-nav__menu--within-overview-sidebar"
      />
    </div>
  );
};

const TopologyHelmReleasePanel = connect<
  PropsFromState,
  PropsFromDispatch,
  TopologyHelmReleasePanelProps
>(
  stateToProps,
  dispatchToProps,
)(ConnectedTopologyHelmReleasePanel);

export default TopologyHelmReleasePanel;
