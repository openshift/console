import * as React from 'react';
import {
  DetailsTabSection,
  isDetailsTabSection,
  ResolvedExtension,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk';
import { orderExtensionBasedOnInsertBeforeAndAfter } from '@console/shared';

export const useDetailsTabSection = (): [
  ResolvedExtension<DetailsTabSection>['properties'][],
  boolean,
] => {
  const [extensions, resolved] = useResolvedExtensions<DetailsTabSection>(isDetailsTabSection);
  const ordered = React.useMemo<ResolvedExtension<DetailsTabSection>['properties'][]>(
    () =>
      resolved
        ? orderExtensionBasedOnInsertBeforeAndAfter<
            ResolvedExtension<DetailsTabSection>['properties']
          >(extensions.map(({ properties }) => properties))
        : [],
    [extensions, resolved],
  );
  return [ordered, resolved];
};
