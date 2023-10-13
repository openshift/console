import * as React from 'react';
import * as _ from 'lodash';
import { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { DetailsItem as DetailsItemExtension } from '@console/dynamic-plugin-sdk/src/extensions/details-item';
import { ResolvedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { DetailsItem } from '@console/internal/components/utils/details-item';

export const ExtensionDetailsItem: ExtensionDetailsItemComponent = ({ extension, obj }) => {
  const { path, title, component: Component } = extension.properties;
  const sortWeight = Number(extension.properties.sortWeight) || Infinity;
  const content = Component ? (
    <Component key={extension.properties.id} obj={obj} />
  ) : (
    _.get(obj, path, '-').toString()
  );

  return (
    <DetailsItem
      obj={obj}
      path={path}
      label={title}
      labelClassName={`details-item__sort-weight-${sortWeight}`} // for visibility
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
