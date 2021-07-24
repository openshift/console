import * as React from 'react';
import { Link } from 'react-router-dom';
import { ResourceIcon } from '@console/internal/components/utils';

type ODFSystemLinkProps = {
  kind: string;
  name: string;
};

const ODFSystemLink: React.FC<ODFSystemLinkProps> = ({ kind, name }) => {
  const path = `/odf/system/${kind}/${name}`;
  return (
    <span>
      <ResourceIcon kind={kind} />
      <Link to={path}>{name}</Link>
    </span>
  );
};

export default ODFSystemLink;
