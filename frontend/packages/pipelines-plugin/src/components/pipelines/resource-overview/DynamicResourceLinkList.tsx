import * as React from 'react';
import classnames from 'classnames';
import PipelineResourceRef from '../../shared/common/PipelineResourceRef';

import './DynamicResourceLinkList.scss';

export type ResourceModelLink = {
  resourceKind: string;
  name: string;
  qualifier?: string;
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
      className={classnames('odc-dynamic-resource-link-list', {
        'odc-dynamic-resource-link-list--addSpaceBelow': !removeSpaceBelow,
      })}
    >
      <dl>
        {title && <dt>{title}</dt>}
        <dd>
          {links.map(({ name, resourceKind, qualifier = '' }) => {
            let linkName = name;
            if (qualifier?.length > 0 && name !== qualifier) {
              linkName += ` (${qualifier})`;
            }
            return (
              <div key={`${resourceKind}/${linkName}`}>
                <PipelineResourceRef
                  resourceKind={resourceKind}
                  resourceName={name}
                  displayName={linkName}
                  namespace={namespace}
                />
              </div>
            );
          })}
        </dd>
      </dl>
    </div>
  );
};

export default DynamicResourceLinkList;
