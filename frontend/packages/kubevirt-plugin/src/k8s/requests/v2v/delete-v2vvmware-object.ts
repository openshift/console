import { k8sKill } from '@console/internal/module/k8s';
import { V2VVMwareModel } from '../../../models';
import * as _ from 'lodash';

export const deleteV2VvmwareObject = async ({
  name,
  namespace,
}: {
  name: string;
  namespace: string;
}) => {
  try {
    return k8sKill(V2VVMwareModel, {
      metadata: {
        name,
        namespace,
      },
    });
  } catch (error) {
    // best effort delete - will be deleted by controller eventually
    if (_.get(error, 'json.code') !== 404 && _.get(error, 'json.reason') !== 'NotFound') {
      // eslint-disable-next-line no-console
      console.log(
        'Failed to remove temporary V2VVMWare object. It is not an issue, it will be garbage collected later if still present, resource: ',
        {
          name,
          namespace,
        },
        ', error: ',
        error,
      );
    }
    return null;
  }
};
