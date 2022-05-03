import * as React from 'react';
import { DetailsTab, isDetailsTab } from '@console/dynamic-plugin-sdk';
import { useExtensions } from '@console/plugin-sdk';
import { orderExtensionBasedOnInsertBeforeAndAfter } from '@console/shared';

export const useDetailsTab = (): DetailsTab['properties'][] => {
  const extensions = useExtensions<DetailsTab>(isDetailsTab);
  const ordered = React.useMemo<DetailsTab['properties'][]>(
    () =>
      orderExtensionBasedOnInsertBeforeAndAfter<DetailsTab['properties']>(
        extensions.map(({ properties }) => properties),
      ),
    [extensions],
  );
  return ordered;
};
