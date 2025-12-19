import type { FC } from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { ResourceLink } from '@console/internal/components/utils';

import './DynamicResourceLink.scss';

interface DynamicResourceLinkProps {
  title: string;
  name: string;
  namespace: string;
  kind: string;
}

const DynamicResourceLink: FC<DynamicResourceLinkProps> = ({
  title,
  name,
  namespace,
  kind,
}) => (
  <div className="kn-resource-link-list kn-resource-link-list--addSpaceBelow">
    <DescriptionList>
      <DescriptionListGroup>
        <DescriptionListTerm>{title}</DescriptionListTerm>
        <DescriptionListDescription>
          <ResourceLink kind={kind} name={name} namespace={namespace} />
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  </div>
);

export default DynamicResourceLink;
