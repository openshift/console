import * as React from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import PipelineResourceRef from '../../shared/common/PipelineResourceRef';
import './DynamicResourceLinkList.scss';

export type ResourceModelLink = {
  resourceKind: string;
  name: string;
  qualifier?: string;
  disableLink?: boolean;
  resourceApiVersion?: string;
};

type DynamicResourceLinkListProps = {
  links: ResourceModelLink[];
  namespace: string;
  title?: string;
  removeSpaceBelow?: boolean;
};

const DynamicResourceLinkList: React.FC<DynamicResourceLinkListProps> = ({
  links = [],
  namespace,
  title,
  removeSpaceBelow,
}) => {
  if (links.length === 0) {
    return null;
  }
  return (
    <div
      className={css('odc-dynamic-resource-link-list', {
        'odc-dynamic-resource-link-list--addSpaceBelow': !removeSpaceBelow,
      })}
    >
      <DescriptionList>
        <DescriptionListGroup>
          {title && <DescriptionListTerm>{title}</DescriptionListTerm>}
          <DescriptionListDescription>
            {links.map(
              ({ name, resourceKind, qualifier = '', disableLink = false, resourceApiVersion }) => {
                let linkName = qualifier;
                if (qualifier?.length > 0 && name !== qualifier) {
                  linkName += ` (${name})`;
                }
                return (
                  <div key={`${resourceKind}/${linkName}`}>
                    <PipelineResourceRef
                      resourceKind={resourceKind}
                      resourceName={name}
                      displayName={linkName}
                      namespace={namespace}
                      disableLink={disableLink}
                      resourceApiVersion={resourceApiVersion}
                    />
                  </div>
                );
              },
            )}
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    </div>
  );
};

export default DynamicResourceLinkList;
