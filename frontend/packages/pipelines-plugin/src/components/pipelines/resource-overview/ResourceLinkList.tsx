import * as React from 'react';
import { K8sKind } from '@console/internal/module/k8s';
import DynamicResourceLinkList from './DynamicResourceLinkList';

type ResourceLinkListProps = {
  namespace: string;
  model: K8sKind;
  links: string[];
};
const ResourceLinkList: React.FC<ResourceLinkListProps> = ({ links, model, namespace }) => {
  return (
    <DynamicResourceLinkList
      links={links.map((name) => ({ model, name }))}
      namespace={namespace}
      title={model.labelPlural}
    />
  );
};

export default ResourceLinkList;
