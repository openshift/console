import * as React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@patternfly/react-core';
import { ResourceIcon } from '@console/internal/components/utils';
import { TemplateModel } from '@console/internal/models';

export const VMTemplateLink: React.FC<VMTemplateLinkProps> = ({ name, namespace, uid, vendor }) => (
  <>
    <ResourceIcon kind={TemplateModel.kind} />
    <Link
      to={`/k8s/ns/${namespace}/vmtemplates/${name}`}
      title={uid}
      data-test-id={name}
      className="co-resource-item__resource-name"
    >
      {name}
    </Link>
    {vendor && <Badge isRead>vendor</Badge>}
  </>
);

type VMTemplateLinkProps = {
  name: string;
  namespace: string;
  uid?: string;
  vendor?: boolean;
};
