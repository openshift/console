import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';
import { Node } from '@patternfly/react-topology';
import * as UIActions from '@console/internal/actions/ui';
import './TopologyKafkaPanel.css';
import { navFactory, SimpleTabNav } from '@console/internal/components/utils';
import { ResourcesComponent } from './ResourceComponent';
import { DetailsComponent } from './DetailsComponent';

type PropsFromState = {
  selectedDetailsTab?: string;
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
  item: Node;
};

type TopologyRhoasPanelProps = PropsFromState & PropsFromDispatch & OwnProps;

export const ConnectedTopologyRhoasPanel: React.FC<TopologyRhoasPanelProps> = ({
  item,
  selectedDetailsTab,
  onClickTab,
}) => {
  const [showAlert, setShowAlert] = React.useState(true);
  const { t } = useTranslation();
  // Resource
  const akc = item?.getData().resource;
  if (!akc) {
    return <>{t('rhoas-plugin~No data')}</>;
  }

  const handleAlertFunction = () => {
    setShowAlert(false);
  };

  return (
    <div className="overview__sidebar-pane resource-overview">
      <div className="overview__sidebar-pane-head resource-overview__heading">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            <h3>{t('rhoas-plugin~Kafka Connection')}</h3>
          </div>
        </h1>
        {showAlert && (
          <div className="rhoas-topology-kafka-panel-alert">
            <Alert
              variant="default"
              title={t('rhoas-plugin~Cloud Service')}
              actionClose={<AlertActionCloseButton onClick={handleAlertFunction} />}
              isInline
            >
              {t('rhoas-plugin~This resource represents service that exist outside your cluster')}
            </Alert>
          </div>
        )}
      </div>

      <SimpleTabNav
        selectedTab={selectedDetailsTab}
        onClickTab={onClickTab}
        tabs={[
          {
            name: t('rhoas-plugin~Details'),
            component: navFactory.details(DetailsComponent).component,
          },
          { name: t('rhoas-plugin~Resources'), component: ResourcesComponent },
        ]}
        tabProps={{ obj: akc }}
        additionalClassNames="co-m-horizontal-nav__menu--within-sidebar co-m-horizontal-nav__menu--within-overview-sidebar"
      />
    </div>
  );
};

export default connect<PropsFromState, PropsFromDispatch, TopologyRhoasPanelProps>(
  stateToProps,
  dispatchToProps,
)(ConnectedTopologyRhoasPanel);
