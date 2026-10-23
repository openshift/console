import { FLAG_TECH_PREVIEW } from '@console/app/src/consts';
import type { FeatureFlagHandler } from '@console/dynamic-plugin-sdk/src/extensions/feature-flags';
import { useFlag } from '@console/dynamic-plugin-sdk/src/utils/flags';
import {
  FLAG_CLUSTER_EXTENSION_API,
  FLAG_INSTALLED_OPERATORS,
  FLAG_OPERATOR_LIFECYCLE_MANAGER,
} from '../const';

/**
 * The tabbed Installed Operators page is Tech Preview only; outside Tech Preview the Classic
 * ClusterServiceVersion list stays on its own nav item. Within Tech Preview the page hosts a
 * Next-Gen (OLMv1) and a Classic (OLMv0) tab, so it must be reachable whenever either OLM is
 * installed. `flags.required` is an AND, hence this derived flag.
 */
const useInstalledOperatorsFlagProvider: FeatureFlagHandler = (setFeatureFlag) => {
  const techPreview = useFlag(FLAG_TECH_PREVIEW);
  const clusterExtensionAPI = useFlag(FLAG_CLUSTER_EXTENSION_API);
  const operatorLifecycleManager = useFlag(FLAG_OPERATOR_LIFECYCLE_MANAGER);

  setFeatureFlag(
    FLAG_INSTALLED_OPERATORS,
    Boolean(techPreview && (clusterExtensionAPI || operatorLifecycleManager)),
  );
};

export default useInstalledOperatorsFlagProvider;
