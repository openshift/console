import * as React from 'react';
import { ResourceLink } from '@console/internal/components/utils';

import './DynamicResourceLink.scss';

interface DynamicResourceLinkProps {
  title: string;
  name: string;
  namespace: string;
  kind: string;
}

const DynamicResourceLink: React.FC<DynamicResourceLinkProps> = ({
  title,
  name,
  namespace,
  kind,
}) => (
  <div className="kn-resource-link-list kn-resource-link-list--addSpaceBelow">
    <dl>
      <dt>{title}</dt>
      <dd>
        <ResourceLink kind={kind} name={name} namespace={namespace} />
      </dd>
    </dl>
  </div>
);

export default DynamicResourceLink;
