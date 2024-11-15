import * as React from 'react';
import * as _ from 'lodash';
import { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { DetailsItem as DetailsItemExtension } from '@console/dynamic-plugin-sdk/src/extensions/details-item';
import { ResolvedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { DetailsItem } from '@console/internal/components/utils/details-item';

export const ExtensionDetailsItem: ExtensionDetailsItemComponent = ({ extension, obj }) => {
  const { path, title, description, component: Component, id } = extension.properties;
  const sortWeight = extension.properties.sortWeight ?? 'none';
  const value = _.get(obj, path);
  if (!Component && typeof value === 'object') {
    // eslint-disable-next-line no-console
    console.warn(
      `Invalid 'console.resource/details-item' extension: '${id}'. The value referenced at path '${path}' must be primitive if not accompanied by a custom component.`,
    );
  }
  const content = Component ? (
    <Component obj={obj} path={path} value={value} />
  ) : (
    (value ?? '-').toString()
  );

  return (
    <DetailsItem
      obj={obj}
      path={path}
      label={title}
      labelClassName={`details-item__sort-weight-${sortWeight}`} // for visibility
      description={description}
    >
      {content}
    </DetailsItem>
  );
};

type ExtensionDetailsItemProps = {
  obj: K8sResourceCommon;
  extension: ResolvedExtension<DetailsItemExtension>;
};
type ExtensionDetailsItemComponent = (props: ExtensionDetailsItemProps) => React.ReactElement;
