import * as React from 'react';
import { useRouteMatch } from 'react-router-dom';
import { PerspectiveContext } from '@console/dynamic-plugin-sdk';
import { CLUSTER_SCOPED_PREFIXES } from '@console/internal/components/utils';
import { usePerspectives, useQueryParams } from '@console/shared/src';
import PerspectiveDetector from './PerspectiveDetector';
import { useValuesForPerspectiveContext } from './useValuesForPerspectiveContext';

type DetectPerspectiveProps = {
  children: React.ReactNode;
};

const useOverridePerspective = (activePerspective) => {
  const perspectiveExtensions = usePerspectives();
  const perspectiveParam = useQueryParams().get('perspective');

  // Force admin perspective if current perspective is ACM and matching route is cluster-scoped
  // FIXME: This is a temporary work-around to prevent linking to cluster-scoped resources without
  // showing the current cluster context. Ideally we will be able to detect multi-cluster or
  // single-cluster scope more dynamically using the plugin API in the future.
  const clusterRouteMatch = useRouteMatch({ path: CLUSTER_SCOPED_PREFIXES });
  const isMulticlusterPerspective = activePerspective === 'acm';
  const overrideClusterScope = !perspectiveParam && clusterRouteMatch && isMulticlusterPerspective;
  const overridePerspective = overrideClusterScope ? 'admin' : perspectiveParam;

  // Only override if the perspective exists.
  return React.useMemo(
    () =>
      perspectiveExtensions.some((e) => e.properties.id === overridePerspective)
        ? overridePerspective
        : null,
    [overridePerspective, perspectiveExtensions],
  );
};

const DetectPerspective: React.FC<DetectPerspectiveProps> = ({ children }) => {
  const [activePerspective, setActivePerspective, loaded] = useValuesForPerspectiveContext();
  const overridePerspective = useOverridePerspective(activePerspective);
  React.useEffect(() => {
    if (overridePerspective && overridePerspective !== activePerspective) {
      setActivePerspective(overridePerspective);
    }
  }, [activePerspective, overridePerspective, setActivePerspective]);
  return loaded ? (
    activePerspective ? (
      <PerspectiveContext.Provider value={{ activePerspective, setActivePerspective }}>
        {children}
      </PerspectiveContext.Provider>
    ) : (
      <PerspectiveDetector setActivePerspective={setActivePerspective} />
    )
  ) : null;
};

export default DetectPerspective;
