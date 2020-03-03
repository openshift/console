import * as React from 'react';
import { Link } from 'react-router-dom';
import * as _ from 'lodash';
import {
  Firehose,
  FirehoseResult,
  LoadingBox,
  StatusBox,
  navFactory,
  ResourceIcon,
  SimpleTabNav,
  FirehoseResource,
} from '@console/internal/components/utils';
import { SecretModel } from '@console/internal/models';
import { K8sResourceCommon } from '@console/internal/module/k8s';
import { Node } from '@console/topology';
import HelmReleaseOverview from '../helm/HelmReleaseOverview';

export type TopologyHelmReleasePanelObjProps = {
  obj?: FirehoseResult<K8sResourceCommon>;
};

export type TopologyHelmReleasePanelSecretsProps = {
  secrets?: FirehoseResult<K8sResourceCommon[]>;
  helmReleaseName: string;
};

export type TopologyHelmReleasePanelProps = {
  helmRelease: Node;
};

const TopologyHelmReleasePanelObj: React.FC<TopologyHelmReleasePanelObjProps> = ({ obj }) => {
  if (!obj || (!obj.loaded && _.isEmpty(obj.loadError))) {
    return <LoadingBox />;
  }

  if (obj.loadError) {
    return <StatusBox loaded={obj.loaded} loadError={obj.loadError} />;
  }

  const name = obj.data?.metadata.labels?.name;
  const namespace = obj.data?.metadata.namespace;

  return (
    <div className="overview__sidebar-pane resource-overview">
      <div className="overview__sidebar-pane-head resource-overview__heading">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            <ResourceIcon className="co-m-resource-icon--lg" kind="HelmRelease" />
            <Link
              to={`/helm-releases/ns/${namespace}/release/${name}`}
              className="co-resource-item__resource-name"
            >
              {name}
            </Link>
          </div>
        </h1>
      </div>
      <SimpleTabNav
        selectedTab={'Details'}
        tabs={[{ name: 'Details', component: navFactory.details(HelmReleaseOverview).component }]}
        tabProps={{ obj: obj.data }}
        additionalClassNames="co-m-horizontal-nav__menu--within-sidebar co-m-horizontal-nav__menu--within-overview-sidebar"
      />
    </div>
  );
};

const TopologyHelmReleasePanelSecrets: React.FC<TopologyHelmReleasePanelSecretsProps> = ({
  secrets,
  helmReleaseName,
}) => {
  if (!secrets || (!secrets.loaded && _.isEmpty(secrets.loadError))) {
    return <LoadingBox />;
  }

  if (secrets.loadError) {
    return <StatusBox loaded={secrets.loaded} loadError={secrets.loadError} />;
  }

  const secretResource = secrets.data[0];
  if (!secretResource) {
    return (
      <StatusBox
        loaded={secrets.loaded}
        loadError={{ message: `Unable to find resource for ${helmReleaseName}` }}
      />
    );
  }

  return (
    <Firehose
      resources={[
        {
          kind: SecretModel.kind,
          kindObj: SecretModel,
          name: secretResource.metadata.name,
          namespace: secretResource.metadata.namespace,
          isList: false,
          prop: 'obj',
        } as FirehoseResource,
      ]}
    >
      <TopologyHelmReleasePanelObj />
    </Firehose>
  );
};

const TopologyHelmReleasePanel: React.FC<TopologyHelmReleasePanelProps> = ({ helmRelease }) => {
  const { namespace } = helmRelease.getData().groupResources[0].resources.obj.metadata;
  const helmReleaseName = helmRelease.getLabel();
  return (
    <Firehose
      resources={[
        {
          kind: SecretModel.kind,
          namespace,
          isList: true,
          selector: { name: `${helmReleaseName}` },
          prop: 'secrets',
        },
      ]}
    >
      <TopologyHelmReleasePanelSecrets helmReleaseName={helmReleaseName} />
    </Firehose>
  );
};

export default TopologyHelmReleasePanel;
