import * as React from 'react';
import { ResourceLink, ExternalLink } from '@console/internal/components/utils';
import { K8sKind, referenceForModel } from '@console/internal/module/k8s';
import { RouteTemplate } from '../utils/triggers';
import './TriggerTemplateResourceLink.scss';

type TriggerTemplateResourceLinkProps = {
  namespace: string;
  model: K8sKind;
  links: RouteTemplate[];
};
const TriggerTemplateResourceLink: React.FC<TriggerTemplateResourceLinkProps> = ({
  links = [],
  namespace,
  model,
}) => {
  const title = model.labelPlural;
  const kind = referenceForModel(model);

  if (links.length === 0) {
    return null;
  }
  return (
    <div className="odc-trigger-template-list">
      <dl>
        <dt>{title}</dt>
        {links.map(({ routeURL, triggerTemplateName }) => {
          return (
            <dd key={triggerTemplateName}>
              <ResourceLink
                kind={kind}
                name={triggerTemplateName}
                namespace={namespace}
                title={triggerTemplateName}
                inline
              />
              {routeURL && (
                <div className="odc-trigger-template-list__url">
                  <ExternalLink href={routeURL} text={routeURL} />
                </div>
              )}
            </dd>
          );
        })}
      </dl>
    </div>
  );
};

export default TriggerTemplateResourceLink;
