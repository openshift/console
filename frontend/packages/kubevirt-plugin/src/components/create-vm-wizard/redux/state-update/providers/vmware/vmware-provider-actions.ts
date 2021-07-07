import { EnhancedK8sMethods } from '../../../../../../k8s/enhancedK8sMethods/enhancedK8sMethods';
import {
  cleanupAndGetResults,
  errorsFirstSort,
} from '../../../../../../k8s/enhancedK8sMethods/k8sMethodsUtils';
import {
  createV2VvmwareObject,
  createV2VvmwareObjectWithSecret,
} from '../../../../../../k8s/requests/v2v/create-v2vvmware-object';
import { deleteV2VvmwareObject } from '../../../../../../k8s/requests/v2v/delete-v2vvmware-object';
import { requestV2VMwareVMDetail } from '../../../../../../k8s/requests/v2v/request-v2vmware-vm-detail';
import { startV2VVMWareController } from '../../../../../../k8s/requests/v2v/start-v2vvmware-controller';
import { getName } from '../../../../../../selectors';
import { getV2VConnectionName } from '../../../../../../selectors/v2v';
import { getSimpleV2VPRoviderStatus } from '../../../../../../statuses/v2v';
import {
  iGetVMWareField,
  iGetVMWareFieldValue,
} from '../../../../selectors/immutable/provider/vmware/selectors';
import { iGetCommonData } from '../../../../selectors/immutable/selectors';
import { VMImportProvider, VMWareProviderField, VMWizardProps } from '../../../../types';
import { asDisabled, asHidden } from '../../../../utils/utils';
import { vmWizardInternalActions } from '../../../internal-actions';
import { InternalActionType, UpdateOptions } from '../../../types';
import { forceUpdateWSQueries } from './update-ws-queries';

const { info: consoleInfo, warn: consoleWarn, error: consoleError } = console;

export const startV2VVMWareControllerWithCleanup = ({ getState, id, dispatch }: UpdateOptions) => {
  const state = getState();
  const namespace = iGetCommonData(state, id, VMWizardProps.activeNamespace);
  const enhancedK8sMethods = new EnhancedK8sMethods();

  return startV2VVMWareController({ namespace }, enhancedK8sMethods, VMImportProvider.VMWARE)
    .then(() =>
      dispatch(
        vmWizardInternalActions[InternalActionType.UpdateImportProviderField](
          id,
          VMImportProvider.VMWARE,
          VMWareProviderField.CONTROLLER_LAST_ERROR,
          {
            isHidden: asHidden(true, VMWareProviderField.CONTROLLER_LAST_ERROR),
            errors: null,
          },
        ),
      ),
    )
    .catch((e) =>
      // eslint-disable-next-line promise/no-nesting
      cleanupAndGetResults(enhancedK8sMethods, e, { prettyPrintPermissionErrors: true }).then(
        (results) => {
          const errors = errorsFirstSort([...results.errors, ...results.requestResults]);
          if (results.mainError) {
            consoleWarn(results.mainError?.message, results.mainError?.detail);
          }
          errors.forEach((o) => consoleWarn(o.title, o.content.data));
          return dispatch(
            vmWizardInternalActions[InternalActionType.UpdateImportProviderField](
              id,
              VMImportProvider.VMWARE,
              VMWareProviderField.CONTROLLER_LAST_ERROR,
              {
                isHidden: asHidden(false, VMWareProviderField.CONTROLLER_LAST_ERROR),
                errors: results,
              },
            ),
          );
        },
      ),
    )
    .catch((le) => consoleError(le));
};

export const createConnectionObjects = async (
  options: { id: string; dispatch: any },
  params: {
    connectionSecretName?: string;
    url?: string;
    username?: string;
    password?: string;
    namespace?: string;
    prevNamespace?: string;
    prevV2VName?: string;
  },
) => {
  const { id, dispatch } = options;
  const create = params.connectionSecretName
    ? createV2VvmwareObject
    : createV2VvmwareObjectWithSecret;
  const { namespace, prevNamespace, prevV2VName } = params;

  if (prevNamespace && prevV2VName) {
    const deleteParams = { name: prevV2VName, namespace: prevNamespace };
    consoleInfo('destroying stale v2vvmware object ', deleteParams);
    deleteV2VvmwareObject(deleteParams);
    dispatch(
      vmWizardInternalActions[InternalActionType.UpdateImportProvider](
        id,
        VMImportProvider.VMWARE,
        {
          [VMWareProviderField.CURRENT_V2V_VMWARE_CR_NAME]: null,
          [VMWareProviderField.CURRENT_RESOLVED_VCENTER_SECRET_NAME]: null,
          [VMWareProviderField.VM]: {
            value: null,
            isDisabled: asDisabled(true, VMWareProviderField.VM),
            vm: null,
            thumbprint: null,
          },
          [VMWareProviderField.STATUS]: {
            value: null,
          },
        },
      ),
    );
    forceUpdateWSQueries({ id, dispatch }, { namespace, v2vVmwareName: null });
  }

  consoleInfo('creating v2vvmware object');
  return create(params, new EnhancedK8sMethods())
    .then((v2vVmware) => {
      const v2vVmwareName = getName(v2vVmware);
      const activeVcenterSecretName = getV2VConnectionName(v2vVmware);
      dispatch(
        vmWizardInternalActions[InternalActionType.UpdateImportProvider](
          id,
          VMImportProvider.VMWARE,
          {
            [VMWareProviderField.CURRENT_V2V_VMWARE_CR_NAME]: v2vVmwareName,
            [VMWareProviderField.CURRENT_RESOLVED_VCENTER_SECRET_NAME]: activeVcenterSecretName,
          },
        ),
      );
      forceUpdateWSQueries({ id, dispatch }, { namespace, v2vVmwareName });
    })
    .catch((err) => {
      consoleWarn('onVmwareCheckConnection(): Check for VMWare credentials failed, reason: ', err);
      dispatch(
        vmWizardInternalActions[InternalActionType.UpdateImportProvider](
          id,
          VMImportProvider.VMWARE,
          {
            [VMWareProviderField.STATUS]: {
              // The CR can not be created
              isHidden: asHidden(false, VMImportProvider.VMWARE),
              value: getSimpleV2VPRoviderStatus(null, { hasConnectionFailed: true })?.getValue(),
            },
          },
        ),
      );
      forceUpdateWSQueries({ id, dispatch }, { namespace, v2vVmwareName: null });
    });
};

export const getCheckConnectionAction = (id, prevState = null) => (dispatch, getState) => {
  const state = getState();

  const beforeMetadata = {
    isDisabled: asDisabled(true, VMWareProviderField.PASSWORD),
  };
  const afterMetadata = {
    isDisabled: asDisabled(false, VMWareProviderField.PASSWORD),
  };

  const namespace = iGetCommonData(state, id, VMWizardProps.activeNamespace);
  const url = iGetVMWareFieldValue(state, id, VMWareProviderField.HOSTNAME);
  const username = iGetVMWareFieldValue(state, id, VMWareProviderField.USERNAME);
  const password = iGetVMWareFieldValue(state, id, VMWareProviderField.PASSWORD);

  if (!namespace || !url || !username || !password) {
    return;
  }

  // start connecting
  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateImportProvider](id, VMImportProvider.VMWARE, {
      [VMWareProviderField.HOSTNAME]: beforeMetadata,
      [VMWareProviderField.USERNAME]: beforeMetadata,
      [VMWareProviderField.PASSWORD]: beforeMetadata,
      [VMWareProviderField.REMEMBER_PASSWORD]: beforeMetadata,
    }),
  );

  // side effect
  // eslint-disable-next-line promise/catch-or-return
  createConnectionObjects(
    { id, dispatch },
    {
      namespace,
      url,
      username,
      password,
      prevNamespace: iGetCommonData(prevState || state, id, VMWizardProps.activeNamespace),
      prevV2VName: iGetVMWareField(
        prevState || state,
        id,
        VMWareProviderField.CURRENT_V2V_VMWARE_CR_NAME,
      ),
    },
  )
    .catch(consoleError)
    .then(() =>
      dispatch(
        vmWizardInternalActions[InternalActionType.UpdateImportProvider](
          id,
          VMImportProvider.VMWARE,
          {
            [VMWareProviderField.HOSTNAME]: afterMetadata,
            [VMWareProviderField.USERNAME]: afterMetadata,
            [VMWareProviderField.PASSWORD]: afterMetadata,
            [VMWareProviderField.REMEMBER_PASSWORD]: afterMetadata,
          },
        ),
      ),
    );
};

export const requestVmDetails = (id: string, vmName: string) => (dispatch, getState) => {
  const state = getState();
  const namespace = iGetCommonData(state, id, VMWizardProps.activeNamespace);
  const v2vwmwareName = iGetVMWareField(state, id, VMWareProviderField.CURRENT_V2V_VMWARE_CR_NAME);
  const params = { vmName, namespace, v2vwmwareName };

  consoleInfo('requesting vm detail');
  requestV2VMwareVMDetail(params, new EnhancedK8sMethods()).catch((reason) => {
    // TODO: show in status?
    consoleWarn(
      'onVCenterVmSelectedConnected: Failed to patch the V2VVMWare object to query VM details: ',
      params,
      ', reason: ',
      reason,
    );
  });
};
