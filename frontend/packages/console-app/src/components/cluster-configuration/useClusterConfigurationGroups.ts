import * as React from 'react';
import {
  ClusterConfigurationGroup,
  isClusterConfigurationGroup,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk/src';
import { orderExtensionBasedOnInsertBeforeAndAfter } from '@console/shared/src';
import { ResolvedClusterConfigurationGroup } from './types';

const useClusterConfigurationGroups = (): [
  ResolvedClusterConfigurationGroup[],
  boolean,
  Error[],
] => {
  const [resolvedExtensions, resolved, errors] = useResolvedExtensions<ClusterConfigurationGroup>(
    isClusterConfigurationGroup,
  );

  const sortedGroups = React.useMemo(() => {
    return orderExtensionBasedOnInsertBeforeAndAfter(
      resolvedExtensions.map((resolvedExtension) => resolvedExtension.properties),
    );
  }, [resolvedExtensions]);

  return [sortedGroups, resolved, errors];
};

export default useClusterConfigurationGroups;
