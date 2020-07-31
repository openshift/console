import * as React from 'react';
import * as classNames from 'classnames';
import { Link } from 'react-router-dom';

import { ResourceIcon } from './resource-icon';
import {
  groupVersionFor,
  K8sResourceCommon,
  K8sResourceKind,
  referenceForGroupVersionKind,
  referenceForModel,
  referenceForOwnerRef,
  OwnerReference,
} from '../../module/k8s';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager/src/models';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager';
import { k8sList } from '../../module/k8s/resource';

const isOwnedByOperator = (csv: K8sResourceKind, owner: OwnerReference) => {
  const { group } = groupVersionFor(owner.apiVersion);
  return csv.spec?.customresourcedefinitions?.owned?.some((owned) => {
    const ownedGroup = owned.name.substring(owned.name.indexOf('.') + 1);
    return owned.kind === owner.kind && ownedGroup === group;
  });
};

const matchOwnerAndCSV = (owner: OwnerReference, csvs: K8sResourceCommon[] = []) => {
  return csvs.find((csv) => isOwnedByOperator(csv, owner));
};

const ManagedByOperatorResourceLink: React.SFC<ManagerLinkProps> = (props) => {
  const { csvName, namespace, owner } = props;
  const name = owner.name;
  const { group, version } = groupVersionFor(owner.apiVersion);
  const kind = owner.kind;

  const reference = referenceForGroupVersionKind(group)(version)(kind);

  const link = `/k8s/ns/${namespace}/${referenceForModel(
    ClusterServiceVersionModel,
  )}/${csvName}/${reference}/${name}`;

  return (
    <span className="co-resource-item">
      <ResourceIcon kind={referenceForOwnerRef(owner)} />
      <Link to={link} className="co-resource-item__resource-name" data-test-operand-link={name}>
        {name}
      </Link>
    </span>
  );
};

export const ManagedByOperatorLink: React.SFC<ManagedByLinkProps> = (props) => {
  const { obj, className } = props;
  const [data, setData] = React.useState<ClusterServiceVersionKind[] | undefined>();
  const namespace = obj.metadata.namespace;
  React.useEffect(() => {
    if (!namespace) {
      return;
    }
    k8sList(ClusterServiceVersionModel, { ns: namespace })
      .then(setData)
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error('Could not fetch CSVs', e);
      });
  }, [namespace]);
  const ownerReferences = obj.metadata.ownerReferences || [];
  const owner = data
    ? ownerReferences.find((o) => data.some((csv) => isOwnedByOperator(csv, o)))
    : undefined;
  const csv = data && owner ? matchOwnerAndCSV(owner, data) : undefined;

  if (owner && csv) {
    return (
      <div className={classNames('co-m-pane__heading-owner', className)}>
        Managed by{' '}
        <ManagedByOperatorResourceLink
          namespace={namespace}
          csvName={csv.metadata.name}
          owner={owner}
        />
      </div>
    );
  }
  return null;
};

type ManagedByLinkProps = {
  className?: string;
  obj: K8sResourceCommon;
};

type ManagerLinkProps = {
  csvName: string;
  namespace: string;
  owner: OwnerReference;
};
