import { consoleFetchJSON } from '@console/dynamic-plugin-sdk/src/utils/fetch/console-fetch';
import { ConsoleOperatorConfigModel } from '@console/internal/models';
import { K8sResourceKind, resourceURL } from '@console/internal/module/k8s';
import { CONSOLE_OPERATOR_CONFIG_NAME } from '../../constants/resource';

/**
 * JSON Merge Patch instead of JSON patch to update also properties that doesn't exist yet.
 *
 * See https://kubernetes.io/docs/tasks/manage-kubernetes-objects/update-api-object-kubectl-patch/#use-a-json-merge-patch-to-update-a-deployment
 */
const patchConsoleOperatorConfig = <R extends K8sResourceKind>(resource: R): Promise<R> => {
  const url = resourceURL(ConsoleOperatorConfigModel, { name: CONSOLE_OPERATOR_CONFIG_NAME });
  return consoleFetchJSON(url, 'PATCH', {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/merge-patch+json;charset=UTF-8',
    },
    body: JSON.stringify(resource),
  });
};

export default patchConsoleOperatorConfig;
