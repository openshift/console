import * as React from 'react';
import { Link } from 'react-router-dom';
import { ResourceIcon } from '@console/internal/components/utils';
import { TemplateModel } from '@console/internal/models';
import { VIRTUALMACHINES_TEMPLATES_BASE_URL } from '../../constants/url-params';

export const VMTemplateLink: React.FC<VMTemplateLinkProps> = ({ name, namespace, uid }) => (
  <>
    <ResourceIcon kind={TemplateModel.kind} />
    <Link
      to={`/k8s/ns/${namespace}/${VIRTUALMACHINES_TEMPLATES_BASE_URL}/${name}`}
      title={uid}
      data-test-id={name}
      className="co-resource-item__resource-name"
    >
      {name}
    </Link>
  </>
);

type VMTemplateLinkProps = {
  name: string;
  namespace: string;
  uid?: string;
};
