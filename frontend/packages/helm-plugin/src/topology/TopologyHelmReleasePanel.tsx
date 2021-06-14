import * as React from 'react';
import { Node } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import * as UIActions from '@console/internal/actions/ui';
import {
  navFactory,
  ResourceIcon,
  SimpleTabNav,
  StatusBox,
  ActionsMenu,
} from '@console/internal/components/utils';
import TopologyGroupResourcesPanel from '@console/topology/src/components/side-bar/TopologyGroupResourcesPanel';
import { getResource } from '@console/topology/src/utils/topology-utils';
import HelmReleaseOverview from '../components/details-page/overview/HelmReleaseOverview';
import { helmReleaseActions } from './actions/helmReleaseActions';
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
  const { t } = useTranslation();
  const secret = helmRelease.getData().resources.obj;
  const { manifestResources, releaseNotes } = helmRelease.getData().data;
  const name = helmRelease.getLabel();
  const { namespace } = getResource(helmRelease).metadata;

  const detailsComponent = !secret
    ? () => (
        <StatusBox
          loaded
          loadError={{
            message: t('helm-plugin~Unable to find resource for {{helmLabel}}', {
              helmLabel: helmRelease.getLabel(),
            }),
          }}
        />
      )
    : navFactory.details(HelmReleaseOverview).component;

  const resourcesComponent = () =>
    manifestResources ? (
      <div className="overview__sidebar-pane-body">
        <TopologyGroupResourcesPanel
          manifestResources={manifestResources}
          releaseNamespace={namespace}
        />
      </div>
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
        selectedTab={selectedDetailsTab || t('helm-plugin~Resources')}
        onClickTab={onClickTab}
        tabs={[
          { name: t('helm-plugin~Details'), component: detailsComponent },
          { name: t('helm-plugin~Resources'), component: resourcesComponent },
          { name: t('helm-plugin~Release notes'), component: releaseNotesComponent },
        ]}
        tabProps={{ obj: secret }}
        additionalClassNames="co-m-horizontal-nav__menu--within-sidebar co-m-horizontal-nav__menu--within-overview-sidebar"
      />
    </div>
  );
};

export default connect<PropsFromState, PropsFromDispatch, TopologyHelmReleasePanelProps>(
  stateToProps,
  dispatchToProps,
)(ConnectedTopologyHelmReleasePanel);
