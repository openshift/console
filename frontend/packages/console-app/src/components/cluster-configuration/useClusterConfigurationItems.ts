import * as React from 'react';
import {
  checkAccess,
  ClusterConfigurationItem,
  isClusterConfigurationItem,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk/src';
import { orderExtensionBasedOnInsertBeforeAndAfter } from '@console/shared/src';
import { ResolvedClusterConfigurationItem } from './types';

const useClusterConfigurationItems = (): [ResolvedClusterConfigurationItem[], boolean, Error[]] => {
  const [resolvedExtensions, resolved, errors] = useResolvedExtensions<ClusterConfigurationItem>(
    isClusterConfigurationItem,
  );

  // Sort
  const sortedItems = React.useMemo(() => {
    return orderExtensionBasedOnInsertBeforeAndAfter(
      resolvedExtensions.map((resolvedExtension) => resolvedExtension.properties),
    );
  }, [resolvedExtensions]);

  // Filter based on permission checks
  const [canRead, updateCanRead] = React.useState<Record<string, boolean>>({});
  const [canWrite, updateCanWrite] = React.useState<Record<string, boolean>>({});
  React.useEffect(() => {
    sortedItems.forEach((item) => {
      if (item.readAccessReview?.length > 0) {
        Promise.all(item.readAccessReview.map((accessReview) => checkAccess(accessReview)))
          .then((result) => {
            const allowed = result.every((r) => r.status.allowed);
            updateCanRead((x) => ({ ...x, [item.id]: allowed }));
          })
          .catch((error) => {
            // eslint-disable-next-line no-console
            console.warn(`readAccessReview check failed for "${item.id}"`, error);
          });
      }

      if (item.writeAccessReview?.length > 0) {
        Promise.all(item.writeAccessReview.map((accessReview) => checkAccess(accessReview)))
          .then((result) => {
            const allowed = result.every((r) => r.status.allowed);
            updateCanWrite((x) => ({ ...x, [item.id]: allowed }));
          })
          .catch((error) => {
            // eslint-disable-next-line no-console
            console.warn(`writeAccessReview check failed for "${item.id}"`, error);
          });
      }
    });
  }, [sortedItems]);

  const filteredItems = React.useMemo<ResolvedClusterConfigurationItem[]>(() => {
    return sortedItems
      .filter((item) => (item.readAccessReview?.length > 0 ? canRead[item.id] : true))
      .map((item) => {
        return {
          ...item,
          readonly: item.writeAccessReview?.length > 0 ? !canWrite[item.id] : false,
        };
      });
  }, [sortedItems, canRead, canWrite]);

  return [filteredItems, resolved, errors];
};

export default useClusterConfigurationItems;
