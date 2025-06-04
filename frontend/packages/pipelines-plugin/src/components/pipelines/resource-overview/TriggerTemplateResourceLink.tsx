import * as React from 'react';
import {
  ClipboardCopy,
  ClipboardCopyVariant,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ResourceLink } from '@console/internal/components/utils';
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
  const { t } = useTranslation();
  const title = t(model.labelPluralKey);
  const kind = referenceForModel(model);

  if (links.length === 0) {
    return null;
  }
  return (
    <DescriptionList className="odc-trigger-template-list">
      <DescriptionListGroup>
        <DescriptionListTerm>{title}</DescriptionListTerm>
        {links.map(({ routeURL, triggerTemplateName }) => {
          return (
            <DescriptionListDescription key={triggerTemplateName}>
              <ResourceLink
                kind={kind}
                name={triggerTemplateName}
                namespace={namespace}
                title={triggerTemplateName}
                inline
              />
              {routeURL && (
                <div>
                  <ClipboardCopy variant={ClipboardCopyVariant.inlineCompact}>
                    {routeURL}
                  </ClipboardCopy>
                </div>
              )}
            </DescriptionListDescription>
          );
        })}
      </DescriptionListGroup>
    </DescriptionList>
  );
};

export default TriggerTemplateResourceLink;
