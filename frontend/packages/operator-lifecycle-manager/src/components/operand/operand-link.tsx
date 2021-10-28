import * as React from 'react';
import * as classNames from 'classnames';
import { Link } from 'react-router-dom';
import { ResourceIcon } from '@console/internal/components/utils';
import { referenceForModel, K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { ClusterServiceVersionModel } from '../../models';

export const csvNameFromWindow = () =>
  window.location.pathname
    .split('/')
    .find(
      (part, i, allParts) =>
        allParts[i - 1] === referenceForModel(ClusterServiceVersionModel) ||
        allParts[i - 1] === ClusterServiceVersionModel.plural,
    );

export const OperandLink: React.FC<OperandLinkProps> = (props) => {
  const { namespace, name } = props.obj.metadata;
  const csvName = props.csvName || csvNameFromWindow();

  const reference = referenceFor(props.obj);
  const to = namespace
    ? `/k8s/ns/${namespace}/${ClusterServiceVersionModel.plural}/${csvName}/${reference}/${name}`
    : `/k8s/cluster/${reference}/${name}`;

  const classes = classNames('co-resource-item', {
    'co-resource-item--inline': props.inline,
  });

  return (
    <span className={classes}>
      <ResourceIcon kind={referenceFor(props.obj)} />
      <Link
        to={to}
        className="co-resource-item__resource-name"
        onClick={props.onClick}
        data-test-operand-link={name}
      >
        {name}
      </Link>
    </span>
  );
};

export type OperandLinkProps = {
  obj: K8sResourceKind;
  csvName?: string;
  onClick?: () => void;
  inline?: boolean;
};

OperandLink.displayName = 'OperandLink';
