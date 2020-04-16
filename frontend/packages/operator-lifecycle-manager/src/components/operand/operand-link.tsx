import * as React from 'react';
import { Link } from 'react-router-dom';
import { referenceForModel, K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { ResourceIcon } from '@console/internal/components/utils';
import { ClusterServiceVersionModel } from '../../models';

export const OperandLink: React.SFC<OperandLinkProps> = (props) => {
  const { namespace, name } = props.obj.metadata;
  const csvName = () =>
    window.location.pathname
      .split('/')
      .find(
        (part, i, allParts) =>
          allParts[i - 1] === referenceForModel(ClusterServiceVersionModel) ||
          allParts[i - 1] === ClusterServiceVersionModel.plural,
      );

  const reference = referenceFor(props.obj);
  const to = namespace
    ? `/k8s/ns/${namespace}/${ClusterServiceVersionModel.plural}/${csvName()}/${reference}/${name}`
    : `/k8s/cluster/${reference}/${name}`;
  return (
    <span className="co-resource-item">
      <ResourceIcon kind={referenceFor(props.obj)} />
      <Link to={to} className="co-resource-item__resource-name" data-test-operand-link={name}>
        {name}
      </Link>
    </span>
  );
};

export type OperandLinkProps = {
  obj: K8sResourceKind;
};

OperandLink.displayName = 'OperandLink';
