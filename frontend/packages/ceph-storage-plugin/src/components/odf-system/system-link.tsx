import * as React from 'react';
import { Link } from 'react-router-dom';
import { ResourceIcon } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { StorageSystemModel } from '../../models';

type ODFSystemLinkProps = {
  kind: string;
  providerName: string;
  systemName: string;
};

const ODFSystemLink: React.FC<ODFSystemLinkProps> = ({ kind, systemName, providerName }) => {
  const path = `/odf/system/${kind}/${providerName}/overview`;
  return (
    <span>
      <ResourceIcon kind={referenceForModel(StorageSystemModel)} />
      <Link to={path}>{systemName}</Link>
    </span>
  );
};

export default ODFSystemLink;
