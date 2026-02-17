import type { ReactElement, FC } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import type { TopologyDataObject } from '@console/dynamic-plugin-sdk/src/extensions/topology-types';
import { ResourceIcon, StatusBox } from '@console/internal/components/utils';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import type { GroupVersionKind, K8sResourceKind } from '@console/internal/module/k8s';
import {
  modelFor,
  referenceFor,
  referenceForGroupVersionKind,
  referenceForModel,
} from '@console/internal/module/k8s';
import type {
  ClusterServiceVersionKind,
  CRDDescription,
} from '@console/operator-lifecycle-manager/src';
import {
  ClusterServiceVersionModel,
  providedAPIForReference,
} from '@console/operator-lifecycle-manager/src';
import {
  flattenCsvResources,
  linkForCsvResource,
} from '@console/operator-lifecycle-manager/src/components/k8s-resource';
import TopologyGroupResourcesPanel from '@console/topology/src/components/side-bar/TopologyGroupResourcesPanel';
import type { OperatorGroupData } from './types';

type OperatorResourcesProps = {
  namespace: string;
  resources: {
    [kind: string]: { data: K8sResourceKind[]; loaded: boolean; loadError?: unknown };
  };
  flatten: (resources: { [kind: string]: { data: K8sResourceKind[] } }) => K8sResourceKind[];
  linkForResource?: (obj: K8sResourceKind) => ReactElement;
};

const OperatorResources: FC<OperatorResourcesProps> = ({
  namespace,
  resources,
  flatten,
  linkForResource,
}) => {
  const { t } = useTranslation();
  const loaded = Object.values(resources).every((r) => r.loaded);
  const loadError = Object.values(resources).find((r) => r.loadError)?.loadError;
  const manifestResources = flatten(resources);
  return (
    <StatusBox
      data={manifestResources}
      loaded={loaded}
      loadError={loadError}
      label={t('olm~Resources')}
    >
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

const OperatorResourcesGetter: FC<OperatorResourcesGetterProps> = ({
  csv,
  modelReference,
  namespace,
  flatten,
}) => {
  const providedAPI = providedAPIForReference(csv, modelReference);
  const linkForResource = (obj: K8sResourceKind) => {
    return linkForCsvResource(obj, providedAPI, csv.metadata.name);
  };

  const resourcesToGet = useMemo(() => {
    const defaultResources = [
      'Deployment',
      'Service',
      'ReplicaSet',
      'Pod',
      'Secret',
      'ConfigMap',
      'Job',
    ];
    return (
      providedAPI?.resources ??
      (defaultResources.map((kind) => ({
        kind,
      })) as CRDDescription['resources'])
    );
  }, [providedAPI]);

  const watchedResources = useMemo(() => {
    return resourcesToGet.reduce((acc, descriptor) => {
      const { name, kind, version } = descriptor;
      const group = name ? name.substring(name.indexOf('.') + 1) : '';
      const reference = group ? referenceForGroupVersionKind(group)(version)(kind) : kind;
      const model = modelFor(reference);
      acc[kind] = {
        kind: model && !model.crd ? kind : reference,
        namespaced: model ? model.namespaced : true,
        namespace,
        isList: true,
        optional: true,
      };
      return acc;
    }, {});
  }, [namespace, resourcesToGet]);

  const resources = useK8sWatchResources<{ [key: string]: K8sResourceKind[] }>(watchedResources);

  return (
    <OperatorResources
      namespace={namespace}
      resources={resources}
      flatten={flatten}
      linkForResource={linkForResource}
    />
  );
};

type TopologyOperatorBackedResourcesProps = {
  item: TopologyDataObject<OperatorGroupData>;
  csv: ClusterServiceVersionKind;
};

const TopologyOperatorBackedResources: FC<TopologyOperatorBackedResourcesProps> = ({
  item,
  csv,
}) => {
  const { t } = useTranslation();
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
        {t('olm~Managed by')}{' '}
        <span className="co-resource-item">
          <ResourceIcon kind={kind} />
          <Link
            to={link}
            className="co-resource-item__resource-name"
            data-test-operand-link={name}
            data-test={name}
          >
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
