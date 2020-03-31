import { DeploymentModel, PodModel } from '@console/internal/models';
import { InternalActionType, UpdateOptions } from '../../../../types';
import {
  ImportProvidersField,
  VMImportProvider,
  OvirtProviderProps,
  VMWizardProps,
} from '../../../../../types';
import { hasImportProvidersChanged } from '../../../../../selectors/immutable/import-providers';
import { vmWizardInternalActions } from '../../../../internal-actions';
import { iGetCommonData } from '../../../../../selectors/immutable/selectors';
import { iGetIn } from '../../../../../../../utils/immutable';
import { iGetCreateVMWizard } from '../../../../../selectors/immutable/common';
import { isOvirtProvider } from '../../../../../selectors/immutable/provider/ovirt/selectors';
import { FirehoseResourceEnhanced } from '../../../../../../../types/custom';
import { V2VVMWARE_DEPLOYMENT_NAME } from '../../../../../../../constants/v2v';

type GetQueriesParams = {
  namespace: string;
};

const getQueries = ({ namespace }: GetQueriesParams): FirehoseResourceEnhanced[] => {
  const resources: FirehoseResourceEnhanced[] = [
    {
      kind: PodModel.kind,
      model: PodModel,
      namespace,
      isList: true,
      selector: {
        matchLabels: { name: V2VVMWARE_DEPLOYMENT_NAME },
      },
      prop: OvirtProviderProps.deploymentPods,
    },
    {
      kind: DeploymentModel.kind,
      model: DeploymentModel,
      namespace,
      name: V2VVMWARE_DEPLOYMENT_NAME,
      isList: false,
      prop: OvirtProviderProps.deployment,
      errorBehaviour: {
        ignore404: true,
      },
    },
  ];

  return resources;
};

export const forceUpdateWSQueries = (
  { dispatch, id }: { id: string; dispatch: any },
  params: GetQueriesParams,
) => {
  dispatch(
    vmWizardInternalActions[InternalActionType.SetExtraWSQueries](
      id,
      VMImportProvider.OVIRT,
      getQueries(params),
    ),
  );
};

export const updateExtraWSQueries = (options: UpdateOptions) => {
  const { id, prevState, getState, changedCommonData, dispatch } = options;
  const state = getState();
  if (
    !(
      (
        changedCommonData.has(VMWizardProps.activeNamespace) ||
        hasImportProvidersChanged(prevState, state, id, ImportProvidersField.PROVIDER)
      ) // ||
      // hasVMWareSettingsChanged(
      //   prevState,
      //   state,
      //   id,
      //   VMWareProviderField.V2V_NAME,
      //   VMWareProviderField.NEW_VCENTER_NAME,
      // )
    )
  ) {
    return;
  }

  const namespace = iGetCommonData(state, id, VMWizardProps.activeNamespace);
  const oldQueries = iGetIn(iGetCreateVMWizard(state, id), [
    'extraWSQueries',
    VMImportProvider.OVIRT,
  ]);

  if (isOvirtProvider(state, id) && namespace) {
    forceUpdateWSQueries({ id, dispatch }, { namespace });
  } else if (oldQueries && oldQueries.size > 0) {
    // reset when new provider selected
    dispatch(
      vmWizardInternalActions[InternalActionType.SetExtraWSQueries](id, VMImportProvider.OVIRT, []),
    );
  }
};
