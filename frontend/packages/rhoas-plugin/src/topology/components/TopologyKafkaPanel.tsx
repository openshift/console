import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';
import { Node } from '@patternfly/react-topology';
import {
  navFactory,
  SimpleTabNav,
  // ResourceIcon,
  ResourceSummary,
  ResourceLink,
} from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { SecretModel } from '@console/internal/models';
import * as UIActions from '@console/internal/actions/ui';
import './TopologyKafkaPanel.css';
// import { KafkaConnectionModel } from '../../models';

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
  item: Node;
};

type TopologyRhoasPanelProps = PropsFromState & PropsFromDispatch & OwnProps;

const DetailsComponent: React.FC<any> = ({ obj }) => {
  const { t } = useTranslation();
  const boostrapServerHost = obj.status?.bootstrapServerHost;

  return (
    <div className="co-m-pane__body">
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={obj} />
        </div>
        {boostrapServerHost && (
          <dl className="co-m-pane__details">
            <dt>{t('rhoas-plugin~Bootstrap Server')}</dt>
            <dd>{boostrapServerHost}</dd>
          </dl>
        )}
      </div>
    </div>
  );
};

const ResourcesComponent = ({ obj }) => {
  const serviceAccountSecretName = obj?.spec?.credentials?.serviceAccountSecretName;
  const { namespace } = obj.metadata;
  // const t = useTranslation();
  const link = (
    <>
      <h3>Secret</h3>
      <ResourceLink
        kind={referenceForModel(SecretModel)}
        name={serviceAccountSecretName}
        namespace={namespace}
      />
    </>
  );

  return (
    <ul>
      <li className="list-group-item container-fluid">
        <div className="row">
          <span className="col-xs-12">{link}</span>
        </div>
      </li>
    </ul>
  );
};

export const ConnectedTopologyRhoasPanel: React.FC<TopologyRhoasPanelProps> = ({
  item,
  selectedDetailsTab,
  onClickTab,
}: TopologyRhoasPanelProps) => {
  const [showAlert, setShowAlert] = React.useState(true);

  // Resource
  const akc = item?.getData().resource;
  if (!akc) {
    return <>No data</>;
  }

  const handleAlertFunction = () => {
    if (showAlert) {
      setShowAlert(false);
    }
  };

  return (
    <div className="overview__sidebar-pane resource-overview">
      <div className="overview__sidebar-pane-head resource-overview__heading">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            {/* <ResourceIcon
              className="co-m-resource-icon--lg co-m-resource-kafka-connection"
              kind={KafkaConnectionModel.abbr}
            /> */}
            <h3>Kafka Connection</h3>
          </div>
        </h1>
        {showAlert && (
          <div className="kafka-panel-alert">
            <Alert
              variant="default"
              title="Cloud Service"
              actionClose={<AlertActionCloseButton onClick={handleAlertFunction} />}
              isInline
            >
              This resource represents service that exist outside your cluster. To view details
              about resource please go to
              <a href="https://cloud.redhat.com/beta/application-services/openshift-streams/">
                {' '}
                OpenShift Streams Apache Kafka{' '}
              </a>{' '}
              console.
            </Alert>
          </div>
        )}
      </div>

      <SimpleTabNav
        selectedTab={selectedDetailsTab}
        onClickTab={onClickTab}
        tabs={[
          { name: 'Details', component: navFactory.details(DetailsComponent).component },
          { name: 'Resources', component: ResourcesComponent },
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
