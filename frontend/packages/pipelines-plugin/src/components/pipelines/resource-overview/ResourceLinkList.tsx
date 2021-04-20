import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { K8sKind } from '@console/internal/module/k8s';
import DynamicResourceLinkList from './DynamicResourceLinkList';

type ResourceLinkListProps = {
  namespace: string;
  model: K8sKind;
  links: string[];
};
const ResourceLinkList: React.FC<ResourceLinkListProps> = ({ links, model, namespace }) => {
  const { t } = useTranslation();
  return (
    <DynamicResourceLinkList
      links={links.map((name) => ({ resourceKind: model.kind, name }))}
      namespace={namespace}
      title={t(model.labelPluralKey)}
    />
  );
};

export default ResourceLinkList;
