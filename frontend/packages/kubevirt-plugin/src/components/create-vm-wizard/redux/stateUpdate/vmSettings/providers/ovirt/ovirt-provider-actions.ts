import { OvirtProviderField, VMImportProvider, VMWizardProps } from '../../../../../types';
import { InternalActionType, UpdateOptions } from '../../../../types';
import { iGetCommonData } from '../../../../../selectors/immutable/selectors';
import { EnhancedK8sMethods } from '../../../../../../../k8s/enhancedK8sMethods/enhancedK8sMethods';
import {
  cleanupAndGetResults,
  errorsFirstSort,
} from '../../../../../../../k8s/enhancedK8sMethods/k8sMethodsUtils';
import { vmWizardInternalActions } from '../../../../internal-actions';
import { asHidden } from '../../../../../utils/utils';
import { startV2VVMWareController } from '../../../../../../../k8s/requests/v2v/start-v2vvmware-controller';

const { warn: consoleWarn, error: consoleError } = console;

export const startVMImportOperatorWithCleanup = ({ getState, id, dispatch }: UpdateOptions) => {
  const state = getState();
  const namespace = iGetCommonData(state, id, VMWizardProps.activeNamespace);
  const enhancedK8sMethods = new EnhancedK8sMethods();

  return startV2VVMWareController({ namespace }, enhancedK8sMethods)
    .then(() =>
      dispatch(
        vmWizardInternalActions[InternalActionType.UpdateImportProviderField](
          id,
          VMImportProvider.OVIRT,
          OvirtProviderField.CONTROLLER_LAST_ERROR,
          {
            isHidden: asHidden(true, OvirtProviderField.CONTROLLER_LAST_ERROR),
            errors: null,
          },
        ),
      ),
    )
    .catch((e) =>
      // eslint-disable-next-line promise/no-nesting
      cleanupAndGetResults(enhancedK8sMethods, e).then((results) => {
        const errors = errorsFirstSort([...results.errors, ...results.requestResults]);
        if (results.mainError) {
          consoleWarn(results.mainError);
        }
        errors.forEach((o) => consoleWarn(o.title, o.content.data));
        return dispatch(
          vmWizardInternalActions[InternalActionType.UpdateImportProviderField](
            id,
            VMImportProvider.OVIRT,
            OvirtProviderField.CONTROLLER_LAST_ERROR,
            {
              isHidden: asHidden(false, OvirtProviderField.CONTROLLER_LAST_ERROR),
              errors: results,
            },
          ),
        );
      }),
    )
    .catch((le) => consoleError(le));
};
