import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  GroupVersionKind,
  K8sResourceKind,
  modelFor,
  referenceFor,
  referenceForGroupVersionKind,
  referenceForModel,
} from '@console/internal/module/k8s';
import {
  ClusterServiceVersionKind,
  ClusterServiceVersionModel,
  CRDDescription,
  providedAPIsFor,
  referenceForProvidedAPI,
} from '@console/operator-lifecycle-manager/src';
import {
  flattenCsvResources,
  linkForCsvResource,
} from '@console/operator-lifecycle-manager/src/components/k8s-resource';
import { Firehose, ResourceIcon, StatusBox } from '@console/internal/components/utils';
import { TopologyDataObject } from '../topology-types';
import TopologyGroupResourcesPanel from '../components/TopologyGroupResourcesPanel';

type OperatorResourcesProps = {
  namespace: string;
  resources?: {
    [kind: string]: { data: K8sResourceKind[] };
  };
  loaded?: boolean;
  loadError?: string;
  flatten: (resources: { [kind: string]: { data: K8sResourceKind[] } }) => K8sResourceKind[];
  linkForResource?: (obj: K8sResourceKind) => React.ReactElement;
};

const OperatorResources: React.FC<OperatorResourcesProps> = ({
  namespace,
  resources,
  loaded,
  loadError,
  flatten,
  linkForResource,
}) => {
  const manifestResources = flatten(resources);
  return (
    <StatusBox data={manifestResources} loaded={loaded} loadError={loadError} label="Resources">
      <TopologyGroupResourcesPanel
        manifestResources={manifestResources}
        releaseNamespace={namespace}
        linkForResource={linkForResource}
      />
    </StatusBox>
  );
};

type OperatorResourcesGetterProps = {
  modelReference: GroupVersionKind;
  csv: ClusterServiceVersionKind;
  namespace: string;
  flatten: (resources: { [kind: string]: { data: K8sResourceKind[] } }) => K8sResourceKind[];
};

const OperatorResourcesGetter: React.FC<OperatorResourcesGetterProps> = ({
  csv,
  modelReference,
  namespace,
  flatten,
}) => {
  const providedAPI = providedAPIsFor(csv).find(
    (desc) => referenceForProvidedAPI(desc) === modelReference,
  );
  const linkForResource = (obj: K8sResourceKind) => {
    return linkForCsvResource(obj, providedAPI, csv.metadata.name);
  };
  const defaultResources = ['Deployment', 'Service', 'ReplicaSet', 'Pod', 'Secret', 'ConfigMap'];
  const resourcesToGet =
    providedAPI?.resources ??
    (defaultResources.map((kind) => ({
      kind,
    })) as CRDDescription['resources']);

  const firehoseResources = resourcesToGet.reduce((acc, descriptor) => {
    const { name, kind, version } = descriptor;
    const group = name ? name.substring(name.indexOf('.') + 1) : '';
    const reference = group ? referenceForGroupVersionKind(group)(version)(kind) : kind;
    const model = modelFor(reference);
    acc.push({
      prop: kind,
      kind: model && !model.crd ? kind : reference,
      namespaced: model ? model.namespaced : true,
      namespace,
      isList: true,
      optional: true,
    });
    return acc;
  }, []);

  return (
    <Firehose resources={firehoseResources}>
      <OperatorResources
        namespace={namespace}
        flatten={flatten}
        linkForResource={linkForResource}
      />
    </Firehose>
  );
};

type TopologyOperatorBackedResourcesProps = {
  item: TopologyDataObject;
  csv: ClusterServiceVersionKind;
};

const TopologyOperatorBackedResources: React.FC<TopologyOperatorBackedResourcesProps> = ({
  item,
  csv,
}) => {
  const { resource } = item;
  const { namespace } = resource.metadata;
  const reference = referenceFor(resource);
  const flatten = flattenCsvResources(resource);
  const getManagedByCSVResourceLink = () => {
    const model = modelFor(referenceFor(csv));
    const { name } = csv.metadata;
    const { kind } = model;

    const link = `/k8s/ns/${namespace}/${referenceForModel(ClusterServiceVersionModel)}/${name}`;

    return (
      <div className="co-m-pane__heading-owner">
        Managed by{' '}
        <span className="co-resource-item">
          <ResourceIcon kind={kind} />
          <Link to={link} className="co-resource-item__resource-name" data-test-operand-link={name}>
            {name}
          </Link>
        </span>
      </div>
    );
  };

  return (
    <div className="overview__sidebar-pane-body">
      {getManagedByCSVResourceLink()}
      <OperatorResourcesGetter
        csv={csv}
        flatten={flatten}
        namespace={namespace}
        modelReference={reference}
      />
    </div>
  );
};

export default TopologyOperatorBackedResources;
