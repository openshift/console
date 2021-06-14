import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import * as UIActions from '@console/internal/actions/ui';
import {
  ResourceIcon,
  ResourceLink,
  SimpleTabNav,
  ResourceSummary,
  SectionHeading,
  Kebab,
  ActionsMenu,
} from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import TopologyEdgeResourcesPanel from '../components/side-bar/TopologyEdgeResourcesPanel';
import { OdcBaseEdge } from '../elements';

type TopologyServiceBindingRequestPanelProps = {
  edge: OdcBaseEdge;
};

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

const ConnectedTopologyServiceBindingRequestPanel: React.FC<PropsFromState &
  PropsFromDispatch &
  TopologyServiceBindingRequestPanelProps> = ({ edge, onClickTab, selectedDetailsTab }) => {
  const { t } = useTranslation();
  const sbr = edge.getResource();
  const ResourcesSection = () => <TopologyEdgeResourcesPanel edge={edge} />;
  const DetailsSection = () => (
    <div className="overview__sidebar-pane-body">
      <SectionHeading text={t('topology~Details')} />
      <ResourceSummary resource={sbr} />
    </div>
  );
  const { common } = Kebab.factory;
  const menuActions = [
    ...Kebab.getExtensionsActionsForKind(modelFor(referenceFor(sbr))),
    ...common,
  ];
  const actions = menuActions.map((a) => a(modelFor(referenceFor(sbr)), sbr));

  return (
    <div className="overview__sidebar-pane resource-overview">
      <div className="overview__sidebar-pane-head resource-overview__heading">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            <ResourceIcon kind={sbr.kind} />
            <ResourceLink
              kind={referenceFor(sbr)}
              name={sbr.metadata.name}
              namespace={sbr.metadata.namespace}
              hideIcon
            />
          </div>
          <div className="co-actions">
            <ActionsMenu actions={actions} />
          </div>
        </h1>
      </div>
      <SimpleTabNav
        selectedTab={selectedDetailsTab || t('topology~Resources')}
        onClickTab={onClickTab}
        tabs={[
          { name: t('topology~Details'), component: DetailsSection },
          { name: t('topology~Resources'), component: ResourcesSection },
        ]}
        tabProps={null}
        additionalClassNames="co-m-horizontal-nav__menu--within-sidebar co-m-horizontal-nav__menu--within-overview-sidebar"
      />
    </div>
  );
};

const TopologyServiceBindingRequestPanel = connect<
  PropsFromState,
  PropsFromDispatch,
  TopologyServiceBindingRequestPanelProps
>(
  stateToProps,
  dispatchToProps,
)(ConnectedTopologyServiceBindingRequestPanel);

export default TopologyServiceBindingRequestPanel;
