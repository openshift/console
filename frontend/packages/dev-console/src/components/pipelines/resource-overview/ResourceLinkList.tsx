import * as React from 'react';
import { ResourceLink } from '@console/internal/components/utils';
import { K8sKind, referenceForModel } from '@console/internal/module/k8s';
import './ResourceLinkList.scss';

type ResourceLinkListProps = {
  namespace: string;
  model: K8sKind;
  links: string[];
};
const ResourceLinkList: React.FC<ResourceLinkListProps> = ({ links = [], model, namespace }) => {
  const title = model.labelPlural;
  const kind = referenceForModel(model);

  if (links.length === 0) {
    return null;
  }
  return (
    <div className="odc-resource-link-list">
      <dl>
        <dt>{title}</dt>
        <dd>
          {links.map((name) => {
            return (
              <div key={name}>
                <ResourceLink kind={kind} name={name} namespace={namespace} title={name} inline />
              </div>
            );
          })}
        </dd>
      </dl>
    </div>
  );
};

export default ResourceLinkList;
