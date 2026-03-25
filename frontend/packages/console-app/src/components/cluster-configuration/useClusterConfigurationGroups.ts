import { useMemo } from 'react';
import type { ClusterConfigurationGroup } from '@console/dynamic-plugin-sdk/src';
import {
  isClusterConfigurationGroup,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk/src';
import { orderExtensionBasedOnInsertBeforeAndAfter } from '@console/shared/src';
import type { ResolvedClusterConfigurationGroup } from './types';

const useClusterConfigurationGroups = (): [
  ResolvedClusterConfigurationGroup[],
  boolean,
  unknown[],
] => {
  const [resolvedExtensions, resolved, errors] = useResolvedExtensions<ClusterConfigurationGroup>(
    isClusterConfigurationGroup,
  );

  const sortedGroups = useMemo(() => {
    return orderExtensionBasedOnInsertBeforeAndAfter(
      resolvedExtensions.map((resolvedExtension) => resolvedExtension.properties),
    );
  }, [resolvedExtensions]);

  return [sortedGroups, resolved, errors];
};

export default useClusterConfigurationGroups;
