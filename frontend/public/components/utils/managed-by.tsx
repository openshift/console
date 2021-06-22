import * as React from 'react';
import * as classNames from 'classnames';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ResourceIcon } from './resource-icon';
import { resourcePathFromModel } from './resource-link';
import {
  K8sResourceCommon,
  referenceForOwnerRef,
  OwnerReference,
  modelFor,
} from '../../module/k8s';
import { findOwner, matchOwnerAndCSV } from '../../module/k8s/managed-by';
import { k8sList } from '../../module/k8s/resource';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager/src/models';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager';
import { ResourceLink } from '.';

export const ManagedByOperatorResourceLink: React.SFC<ManagerLinkProps> = ({
  csvName,
  namespace,
  owner,
  className,
}) => {
  const ownerGroupVersionKind = referenceForOwnerRef(owner);
  const { apiGroup, kind, namespaced } = modelFor(ownerGroupVersionKind) ?? {};
  const ownerIsCSV =
    apiGroup === ClusterServiceVersionModel.apiGroup && kind === ClusterServiceVersionModel.kind;
  const link = resourcePathFromModel(ClusterServiceVersionModel, csvName, namespace);
  return (
    <span className={className}>
      {namespaced ? (
        <>
          <ResourceIcon kind={ownerGroupVersionKind} />
          <Link
            to={ownerIsCSV ? link : `${link}/${ownerGroupVersionKind}/${owner.name}`}
            className="co-resource-item__resource-name"
            data-test-operand-link={owner.name}
          >
            {owner.name}
          </Link>
        </>
      ) : (
        <ResourceLink kind={ownerGroupVersionKind} name={owner.name} />
      )}
    </span>
  );
};

export const ManagedByOperatorLink: React.SFC<ManagedByLinkProps> = ({ obj, className }) => {
  const { t } = useTranslation();
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
  const owner = findOwner(obj, data);
  const csv = data && owner ? matchOwnerAndCSV(owner, data) : undefined;

  return owner && csv ? (
    <div className={classNames('co-m-pane__heading-owner', className)}>
      {t('public~Managed by')}{' '}
      <ManagedByOperatorResourceLink
        className="co-resource-item"
        namespace={namespace}
        csvName={csv.metadata.name}
        owner={owner}
      />
    </div>
  ) : null;
};

type ManagedByLinkProps = {
  className?: string;
  obj: K8sResourceCommon;
};

type ManagerLinkProps = {
  csvName: string;
  namespace: string;
  owner: OwnerReference;
  className?: string;
};
