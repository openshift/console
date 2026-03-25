import { useMemo } from 'react';
import type { DetailsTab } from '@console/dynamic-plugin-sdk';
import { isDetailsTab } from '@console/dynamic-plugin-sdk';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import { orderExtensionBasedOnInsertBeforeAndAfter } from '@console/shared';

export const useDetailsTab = (): DetailsTab['properties'][] => {
  const extensions = useExtensions<DetailsTab>(isDetailsTab);
  const ordered = useMemo<DetailsTab['properties'][]>(
    () =>
      orderExtensionBasedOnInsertBeforeAndAfter<DetailsTab['properties']>(
        extensions.map(({ properties }) => properties),
      ),
    [extensions],
  );
  return ordered;
};
