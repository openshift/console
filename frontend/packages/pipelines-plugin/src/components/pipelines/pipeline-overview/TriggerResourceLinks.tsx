import * as React from 'react';
import { DescriptionList, DescriptionListDescription } from '@patternfly/react-core';
import { ResourceLink, ExternalLinkWithCopy } from '@console/internal/components/utils';
import { K8sKind, referenceForModel } from '@console/internal/module/k8s';
import { RouteTemplate } from '../utils/triggers';
import './TriggerResourceLinks.scss';

type TriggerResourceLinksProps = {
  namespace: string;
  model: K8sKind;
  links: RouteTemplate[];
};
const TriggerResourceLinks: React.FC<TriggerResourceLinksProps> = ({
  links = [],
  namespace,
  model,
}) => {
  if (links.length === 0) {
    return null;
  }
  return (
    <DescriptionList>
      {links.map(({ routeURL, triggerTemplateName }) => {
        return (
          <DescriptionListDescription key={triggerTemplateName}>
            <ResourceLink
              kind={referenceForModel(model)}
              name={triggerTemplateName}
              namespace={namespace}
              title={triggerTemplateName}
              inline
            />
            {routeURL && (
              <div className="opp-trigger-template-link">
                <ExternalLinkWithCopy
                  key={routeURL}
                  link={routeURL}
                  text={routeURL}
                  additionalClassName="pf-v6-u-display-block"
                />
              </div>
            )}
          </DescriptionListDescription>
        );
      })}
    </DescriptionList>
  );
};

export default TriggerResourceLinks;
