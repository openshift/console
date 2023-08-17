import * as React from 'react';
import { Link } from 'react-router-dom-v5-compat';
import { ResourceIcon } from '@console/internal/components/utils';

type LinkProps = {
  kind: string;
  name: string;
};

const ODFResourceLink: React.FC<LinkProps> = ({ kind, name }) => {
  const path = `/odf/resource/${kind}/${name}`;
  return (
    <span>
      <ResourceIcon kind={kind} />
      <Link to={path}>{name}</Link>
    </span>
  );
};

export default ODFResourceLink;
