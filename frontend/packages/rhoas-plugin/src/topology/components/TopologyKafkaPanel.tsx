import * as React from 'react';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';
import { Node } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import * as UIActions from '@console/internal/actions/ui';
import {
  ActionsMenu,
  Kebab,
  navFactory,
  ResourceIcon,
  resourcePath,
  SimpleTabNav,
} from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { KafkaConnectionModel } from '../../models';
import { DetailsComponent } from './DetailsComponent';
import { ResourcesComponent } from './ResourceComponent';

import './TopologyKafkaPanel.scss';

type PropsFromState = {
  selectedDetailsTab?: string;
};

type PropsFromDispatch = {
  onClickTab: (name: string) => void;
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

  const kindRef = referenceFor(akc);
  const kindObj = modelFor(kindRef);

  const commonActions = Kebab.factory.common.map((action) => action);
  const menuActions = commonActions.map((a) => a(kindObj, akc));
  const menuActionsCreator = [
    ...Kebab.getExtensionsActionsForKind(KafkaConnectionModel),
    ...menuActions,
  ];

  return (
    <div className="overview__sidebar-pane resource-overview">
      <div className="overview__sidebar-pane-head resource-overview__heading">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            <ResourceIcon className="co-m-resource-icon--lg" kind={kindRef} />
            <Link
              to={resourcePath(
                kindObj.crd ? kindRef : akc.kind,
                akc.metadata.name,
                akc.metadata.namespace,
              )}
              className="co-resource-item__resource-name"
            >
              {akc.metadata.name}
            </Link>
          </div>
          <div className="co-actions">
            <ActionsMenu actions={menuActionsCreator} />
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

export default connect<PropsFromState, PropsFromDispatch, OwnProps>(
  stateToProps,
  dispatchToProps,
)(ConnectedTopologyRhoasPanel);
