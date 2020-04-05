import { OvirtProviderField, VMImportProvider, VMWizardProps } from '../../../../../types';
import { InternalActionType, UpdateOptions } from '../../../../types';
import { iGetCommonData } from '../../../../../selectors/immutable/selectors';
import { EnhancedK8sMethods } from '../../../../../../../k8s/enhancedK8sMethods/enhancedK8sMethods';
import {
  cleanupAndGetResults,
  errorsFirstSort,
} from '../../../../../../../k8s/enhancedK8sMethods/k8sMethodsUtils';
import { vmWizardInternalActions } from '../../../../internal-actions';
import { asDisabled, asHidden } from '../../../../../utils/utils';
import { startV2VVMWareController } from '../../../../../../../k8s/requests/v2v/start-v2vvmware-controller';
import { getName } from '@console/shared/src';
import { deleteOvirtProviderObject } from '../../../../../../../k8s/requests/v2v/delete-ovrt-provider-object';
import {
  createOvirtProviderObject,
  createOvirtProviderObjectWithSecret,
} from '../../../../../../../k8s/requests/v2v/create-ovirt-provider-object';
import { forceUpdateWSQueries } from './update-ws-queries';
import { getV2VConnectionName } from '../../../../../../../selectors/v2v';
import { getSimpleV2VPRoviderStatus } from '../../../../../../../statuses/v2v';
import {
  iGetOvirtField,
  iGetOvirtFieldValue,
} from '../../../../../selectors/immutable/provider/ovirt/selectors';
import { requestOvirtProviderCRVMDetail } from '../../../../../../../k8s/requests/v2v/request-ovirt-provider-vm-detail';

const { info: consoleInfo, warn: consoleWarn, error: consoleError } = console;

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

export const createConnectionObjects = async (
  options: { id: string; dispatch: any },
  params: {
    connectionSecretName?: string;
    url?: string;
    username?: string;
    password?: string;
    namespace?: string;
    prevNamespace?: string;
    prevOvirtProviderName?: string;
    caCertificate?: string;
  },
) => {
  const { id, dispatch } = options;
  const create = params.connectionSecretName
    ? createOvirtProviderObject
    : createOvirtProviderObjectWithSecret;
  const { namespace, prevNamespace, prevOvirtProviderName } = params;

  if (prevNamespace && prevOvirtProviderName) {
    const deleteParams = { name: prevOvirtProviderName, namespace: prevNamespace };
    consoleInfo('destroying stale OvirtPovider object ', deleteParams);
    deleteOvirtProviderObject(deleteParams);
    dispatch(
      vmWizardInternalActions[InternalActionType.UpdateImportProvider](id, VMImportProvider.OVIRT, {
        [OvirtProviderField.ACTIVE_OVIRT_PROVIDER_CR_NAME]: null,
        [OvirtProviderField.NEW_OVIRT_ENGINE_SECRET_NAME]: null,
        [OvirtProviderField.CLUSTER]: {
          value: null,
        },
        [OvirtProviderField.VM]: {
          value: null,
          isDisabled: asDisabled(true, OvirtProviderField.VM),
          vm: null,
        },
        [OvirtProviderField.STATUS]: {
          value: null,
        },
      }),
    );
    forceUpdateWSQueries(
      { id, dispatch },
      { namespace, activeOvirtProviderCRName: null, activeOvirtProviderSecretName: null },
    );
  }

  consoleInfo('creating ovirt provider object');
  return create(params, new EnhancedK8sMethods())
    .then((ovirtProvider) => {
      const activeOvirtProviderCRName = getName(ovirtProvider);
      const activeOvirtProviderSecretName = getV2VConnectionName(ovirtProvider);
      dispatch(
        vmWizardInternalActions[InternalActionType.UpdateImportProvider](
          id,
          VMImportProvider.OVIRT,
          {
            [OvirtProviderField.ACTIVE_OVIRT_PROVIDER_CR_NAME]: activeOvirtProviderCRName,
            [OvirtProviderField.NEW_OVIRT_ENGINE_SECRET_NAME]: activeOvirtProviderSecretName,
          },
        ),
      );
      forceUpdateWSQueries(
        { id, dispatch },
        { namespace, activeOvirtProviderCRName, activeOvirtProviderSecretName },
      );
    })
    .catch((err) => {
      consoleWarn(
        'ovirt provider check connection: Check for Ovirt credentials failed, reason: ',
        err,
      );
      dispatch(
        vmWizardInternalActions[InternalActionType.UpdateImportProvider](
          id,
          VMImportProvider.OVIRT,
          {
            [OvirtProviderField.STATUS]: {
              // The CR can not be created
              isHidden: asHidden(false, VMImportProvider.OVIRT),
              value: getSimpleV2VPRoviderStatus(null, { hasConnectionFailed: true })?.getValue(),
            },
          },
        ),
      );
      forceUpdateWSQueries(
        { id, dispatch },
        { namespace, activeOvirtProviderCRName: null, activeOvirtProviderSecretName: null },
      );
    });
};

export const getCheckConnectionAction = (id, prevState = null) => (dispatch, getState) => {
  const state = getState();

  const beforeMetadata = {
    isDisabled: asDisabled(true, OvirtProviderField.PASSWORD),
  };
  const afterMetadata = {
    isDisabled: asDisabled(false, OvirtProviderField.PASSWORD),
  };

  const namespace = iGetCommonData(state, id, VMWizardProps.activeNamespace);
  const url = iGetOvirtFieldValue(state, id, OvirtProviderField.API_URL);
  const username = iGetOvirtFieldValue(state, id, OvirtProviderField.USERNAME);
  const password = iGetOvirtFieldValue(state, id, OvirtProviderField.PASSWORD);
  const caCertificate = iGetOvirtFieldValue(state, id, OvirtProviderField.CERTIFICATE);

  if (!namespace || !url || !username || !password || !caCertificate) {
    return;
  }

  // start connecting
  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateImportProvider](id, VMImportProvider.OVIRT, {
      [OvirtProviderField.API_URL]: beforeMetadata,
      [OvirtProviderField.USERNAME]: beforeMetadata,
      [OvirtProviderField.PASSWORD]: beforeMetadata,
      [OvirtProviderField.CERTIFICATE]: beforeMetadata,
      [OvirtProviderField.REMEMBER_PASSWORD]: beforeMetadata,
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
      caCertificate,
      prevNamespace: iGetCommonData(prevState || state, id, VMWizardProps.activeNamespace),
      prevOvirtProviderName: iGetOvirtField(
        prevState || state,
        id,
        OvirtProviderField.ACTIVE_OVIRT_PROVIDER_CR_NAME,
      ),
    },
  )
    .catch(consoleError)
    .then(() =>
      dispatch(
        vmWizardInternalActions[InternalActionType.UpdateImportProvider](
          id,
          VMImportProvider.OVIRT,
          {
            [OvirtProviderField.API_URL]: afterMetadata,
            [OvirtProviderField.USERNAME]: afterMetadata,
            [OvirtProviderField.PASSWORD]: afterMetadata,
            [OvirtProviderField.CERTIFICATE]: afterMetadata,
            [OvirtProviderField.REMEMBER_PASSWORD]: afterMetadata,
          },
        ),
      ),
    );
};

export const requestVmDetails = (id: string, vmID: string) => (dispatch, getState) => {
  const state = getState();
  const namespace = iGetCommonData(state, id, VMWizardProps.activeNamespace);
  const ovirtProviderCRName = iGetOvirtField(
    state,
    id,
    OvirtProviderField.ACTIVE_OVIRT_PROVIDER_CR_NAME,
  );
  const params = { vmID, namespace, ovirtProviderCRName };

  consoleInfo('requesting vm detail');
  requestOvirtProviderCRVMDetail(params, new EnhancedK8sMethods()).catch((reason) => {
    // TODO: show in status?
    consoleWarn(
      'onVCenterVmSelectedConnected: Failed to patch the V2VVMWare object to query VM details: ',
      params,
      ', reason: ',
      reason,
    );
  });
};
