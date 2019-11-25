import { K8sResourceKind } from '@console/internal/module/k8s';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import { Firehose } from '@console/internal/components/utils';
import * as React from 'react';
import { ConfigMapModel, DeploymentModel, PodModel, SecretModel } from '@console/internal/models';
import { Checkbox, TextInput } from '@patternfly/react-core';
import {
  iGetVMwareData,
  iGetVMWareField,
  isVMWareProvider,
} from '../../../../selectors/immutable/provider/vmware/selectors';
import {
  ChangedCommonData,
  CommonData,
  VMImportProvider,
  VMWareProviderField,
  VMWareProviderProps,
  VMWizardProps,
} from '../../../../types';
import { getResource } from '../../../../../../utils';
import {
  V2VVMWARE_DEPLOYMENT_NAME,
  VCENTER_TEMPORARY_LABEL,
  VCENTER_TYPE_LABEL,
  VMWARE_TO_KUBEVIRT_OS_CONFIG_MAP_NAME,
  VMWARE_TO_KUBEVIRT_OS_CONFIG_MAP_NAMESPACE,
} from '../../../../../../constants/v2v';
import { V2VVMwareModel } from '../../../../../../models';
import { IDReferences, makeIDReferences } from '../../../../../../utils/redux/id-reference';
import { vmWizardActions } from '../../../../redux/actions';
import { ActionType } from '../../../../redux/types';
import { FormField, FormFieldType } from '../../../../form/form-field';
import { FormFieldMemoRow } from '../../../../form/form-field-row';
import { iGet, iGetIn } from '../../../../../../utils/immutable';
import { getFieldId } from '../../../../utils/vm-settings-tab-utils';
import { FormFieldReviewContext } from '../../../../form/form-field-review-context';
import { iGetCommonData } from '../../../../selectors/immutable/selectors';
import { VMWareControllerStatusRow } from './vmware-controller-status-row';
import { VMWareControllerErrors } from './vmware-controller-errors';
import { VMWareSecrets } from './vmware-secrets';
import { VMWarePassword } from './vmware-password';
import { VMWareObjectStatus } from './vmware-object-status';
import { VMWareVMs } from './vmware-vms';

class VMWareImportProviderFirehose extends React.Component<VMWareImportProviderFirehoseProps> {
  constructor(props) {
    super(props);
    props.onCommonDataChanged({ dataIDReferences: props.dataIDReferences });
  }

  componentDidUpdate(prevProps) {
    if (!_.isEqual(prevProps.dataIDReferences, this.props.dataIDReferences)) {
      this.props.onCommonDataChanged({ dataIDReferences: this.props.dataIDReferences }); // rest handled by create-vm-wizard
    }
  }

  // helpers
  getField = (key: VMWareProviderField) => iGet(this.props.vmWareData, key);

  getValue = (key: VMWareProviderField) => iGetIn(this.props.vmWareData, [key, 'value']);

  onChange = (key: VMWareProviderField) => (value) => this.props.onFieldChange(key, { value });

  render() {
    const { wizardReduxID } = this.props;

    return (
      <FormFieldReviewContext.Consumer>
        {({ isReview }: { isReview: boolean }) => (
          <>
            {!isReview && (
              <>
                <VMWareControllerErrors key="errors" wizardReduxID={wizardReduxID} />
                <VMWareControllerStatusRow
                  key="controllerstatus-row"
                  wizardReduxID={wizardReduxID}
                  id="v2v-vmware-status"
                />
              </>
            )}
            <VMWareSecrets key="secrets" wizardReduxID={wizardReduxID} />
            <FormFieldMemoRow
              key={VMWareProviderField.HOSTNAME}
              field={this.getField(VMWareProviderField.HOSTNAME)}
              fieldType={FormFieldType.TEXT}
            >
              <FormField>
                <TextInput onChange={this.onChange(VMWareProviderField.HOSTNAME)} />
              </FormField>
            </FormFieldMemoRow>
            <FormFieldMemoRow
              key={VMWareProviderField.USER_NAME}
              field={this.getField(VMWareProviderField.USER_NAME)}
              fieldType={FormFieldType.TEXT}
            >
              <FormField>
                <TextInput onChange={this.onChange(VMWareProviderField.USER_NAME)} />
              </FormField>
            </FormFieldMemoRow>
            {!isReview && (
              <>
                <VMWarePassword key="password" wizardReduxID={wizardReduxID} />
                <FormFieldMemoRow
                  key={FormFieldType.INLINE_CHECKBOX}
                  field={this.getField(VMWareProviderField.REMEMBER_PASSWORD)}
                  fieldType={FormFieldType.INLINE_CHECKBOX}
                >
                  <FormField>
                    <Checkbox
                      className="kubevirt-create-vm-modal__remember-password"
                      id={getFieldId(VMWareProviderField.REMEMBER_PASSWORD)}
                      onChange={this.onChange(VMWareProviderField.REMEMBER_PASSWORD)}
                    />
                  </FormField>
                </FormFieldMemoRow>
                <VMWareObjectStatus key="object-status" wizardReduxID={wizardReduxID} />
              </>
            )}
            <VMWareVMs key="vms" wizardReduxID={wizardReduxID} />
          </>
        )}
      </FormFieldReviewContext.Consumer>
    );
  }
}

type VMWareImportProviderFirehoseProps = {
  vCenterSecrets: K8sResourceKind[];
  v2vvmware: K8sResourceKind;
  vmwareToKubevirtOsConfigMap: K8sResourceKind[];
  activeVcenterSecret: K8sResourceKind;
  // from connect
  vmWareData: any;
  wizardReduxID: string;
  onFieldChange: (key: VMWareProviderField, value: any) => void;
  dataIDReferences: IDReferences;
  onCommonDataChanged: (commonData: CommonData, commonDataChanged?: ChangedCommonData) => void;
};

const VMWareImportProviderConnected: React.FC<VMWareImportProviderConnectedProps> = ({
  isVMWare,
  namespace,
  v2vVmwareName,
  activeVcenterSecretName,
  ...rest
}) => {
  if (!isVMWare) {
    return null;
  }

  const resources = [
    getResource(SecretModel, {
      namespace,
      prop: VMWareProviderProps.vCenterSecrets,
      matchExpressions: [
        {
          key: VCENTER_TYPE_LABEL,
          operator: 'Exists',
        },
        {
          key: VCENTER_TEMPORARY_LABEL,
          operator: 'DoesNotExist',
        },
      ],
    }),
    getResource(ConfigMapModel, {
      name: VMWARE_TO_KUBEVIRT_OS_CONFIG_MAP_NAME,
      namespace: VMWARE_TO_KUBEVIRT_OS_CONFIG_MAP_NAMESPACE,
      isList: false,
      prop: VMWareProviderProps.vmwareToKubevirtOsConfigMap,
      optional: true,
    }),
    getResource(PodModel, {
      namespace,
      matchLabels: { name: V2VVMWARE_DEPLOYMENT_NAME },
      prop: VMWareProviderProps.deploymentPods,
    }),
    getResource(DeploymentModel, {
      namespace,
      name: V2VVMWARE_DEPLOYMENT_NAME,
      isList: false,
      prop: VMWareProviderProps.deployment,
    }),
  ];

  if (v2vVmwareName) {
    resources.push(
      getResource(V2VVMwareModel, {
        name: v2vVmwareName,
        namespace,
        isList: false,
        prop: VMWareProviderProps.v2vvmware,
      }),
    );
  }

  if (activeVcenterSecretName) {
    resources.push(
      getResource(SecretModel, {
        name: activeVcenterSecretName,
        namespace,
        isList: false,
        prop: VMWareProviderProps.activeVcenterSecret,
      }),
    );
  }

  return (
    <Firehose resources={resources} doNotConnectToState>
      <VMWareImportProviderFirehose {...rest} dataIDReferences={makeIDReferences(resources)} />
    </Firehose>
  );
};

type VMWareImportProviderConnectedProps = VMWareImportProviderFirehoseProps & {
  namespace: string;
  v2vVmwareName: string;
  activeVcenterSecretName: string;
  isVMWare: boolean;
};

const stateToProps = (state, { wizardReduxID }) => ({
  namespace: iGetCommonData(state, wizardReduxID, VMWizardProps.activeNamespace),
  isVMWare: isVMWareProvider(state, wizardReduxID),
  v2vVmwareName: iGetVMWareField(state, wizardReduxID, VMWareProviderField.V2V_NAME),
  activeVcenterSecretName: iGetVMWareField(
    state,
    wizardReduxID,
    VMWareProviderField.NEW_VCENTER_NAME,
  ),
  vmWareData: iGetVMwareData(state, wizardReduxID),
});

const dispatchToProps = (dispatch, { wizardReduxID }) => ({
  onCommonDataChanged: (commonData: CommonData, changedCommonData?: ChangedCommonData) => {
    dispatch(
      vmWizardActions[ActionType.UpdateCommonData](wizardReduxID, commonData, changedCommonData),
    );
  },
  onFieldChange: (key: VMWareProviderField, value: any) =>
    dispatch(
      vmWizardActions[ActionType.UpdateVmSettingsProviderField](
        wizardReduxID,
        VMImportProvider.VMWARE,
        key,
        value,
      ),
    ),
});

export const VMWareImportProvider = connect(
  stateToProps,
  dispatchToProps,
)(VMWareImportProviderConnected);
