import * as _ from 'lodash';
import { k8sKill } from '@console/internal/module/k8s';
import { UpdateOptions } from '../../../../types';
import { iGetVMWareField } from '../../../../../selectors/immutable/provider/vmware/selectors';
import { VMWareProviderField, VMWizardProps } from '../../../../../types';
import { iGetCommonData } from '../../../../../selectors/immutable/selectors';
import { V2VVMwareModel } from '../../../../../../../models';

export const cleanupVmWareProvider = async (options: UpdateOptions) => {
  const { id, getState } = options;
  const state = getState();

  const v2vvmwareName = iGetVMWareField(state, id, VMWareProviderField.V2V_NAME);
  if (v2vvmwareName) {
    // This is a friendly help to keep things clean.
    // If missed here (e.g. when the browser window is closed), the kubevirt-vmware controller's garbage
    // collector will do following automatically after a delay.
    const resource = {
      metadata: {
        name: v2vvmwareName,
        namespace: iGetCommonData(state, id, VMWizardProps.activeNamespace),
      },
    };
    try {
      await k8sKill(V2VVMwareModel, resource);
    } catch (error) {
      if (_.get(error, 'json.code') !== 404 && _.get(error, 'json.reason') !== 'NotFound') {
        // eslint-disable-next-line no-console
        console.log(
          'Failed to remove temporary V2VVMWare object. It is not an issue, it will be garbage collected later if still present, resource: ',
          resource,
          ', error: ',
          error,
        );
      }
    }
  }
};
