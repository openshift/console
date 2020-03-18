import { Alert, AlertVariant } from '@patternfly/react-core';
import { InProgressIcon } from '@patternfly/react-icons';
import StatusIconAndText from '@console/shared/src/components/status/StatusIconAndText';
import * as React from 'react';
import { connect } from 'react-redux';
import { V2VVMwareStatus } from '../../../../../../statuses/v2vvmware';
import { VMWareProviderField } from '../../../../types';
import { iGetVMWareField } from '../../../../selectors/immutable/provider/vmware/selectors';
import { FormFieldRow } from '../../../../form/form-field-row';
import { iGetIn } from '../../../../../../utils/immutable';

const CheckingCredentials: React.FC<{}> = () => (
  <StatusIconAndText
    spin
    noTooltip
    title="Checking vCenter Credentials"
    icon={<InProgressIcon />}
  />
);

const LoadingData: React.FC<{}> = () => (
  <StatusIconAndText
    spin
    noTooltip
    title="Connection successful. Loading data"
    icon={<InProgressIcon />}
  />
);

const ConnectionFailed: React.FC<{}> = () => (
  <Alert
    isInline
    variant={AlertVariant.warning}
    title="Could not connect to vCenter using the provided credentials."
  />
);

const ConnectionFailedInfra: React.FC<{}> = () => (
  <Alert
    isInline
    variant={AlertVariant.warning}
    title="Can not verify vCenter credentials, connection to the V2V VMWare failed."
  />
);

const ConnectionSuccessful: React.FC<{}> = () => <>Connection successful</>;

const ConnectionUnknown: React.FC<{}> = () => <>Status unknown</>;

const ReadVmsListFailed: React.FC<{}> = () => (
  <Alert
    isInline
    variant={AlertVariant.warning}
    title="Connection succeeded but could not read list of virtual machines from the vCenter instance."
  />
);

const ReadVmDetailFailed: React.FC<{}> = () => (
  <Alert
    isInline
    variant={AlertVariant.warning}
    title="Connection succeeded but could not read details of the virtual machine from the vCenter instance."
  />
);

const vmwareStatusComponentResolver = {
  [V2VVMwareStatus.CONNECTING.getValue()]: CheckingCredentials,
  [V2VVMwareStatus.CONNECTION_TO_VCENTER_FAILED.getValue()]: ConnectionFailedInfra,
  [V2VVMwareStatus.CONNECTION_FAILED.getValue()]: ConnectionFailed,
  [V2VVMwareStatus.LOADING_VMS_LIST.getValue()]: LoadingData,
  [V2VVMwareStatus.LOADING_VMS_LIST_FAILED.getValue()]: ReadVmsListFailed,
  [V2VVMwareStatus.LOADING_VM_DETAIL.getValue()]: LoadingData,
  [V2VVMwareStatus.LOADING_VM_DETAIL_FAILED.getValue()]: ReadVmDetailFailed,
  [V2VVMwareStatus.CONNECTION_SUCCESSFUL.getValue()]: ConnectionSuccessful,
  [V2VVMwareStatus.UNKNOWN.getValue()]: ConnectionUnknown,
};

// see onVmwareCheckConnection() for details
const VMWareObjectStatusConnected: React.FC<VMWareObjectStatusConnectedProps> = React.memo(
  ({ statusField }) => {
    const status = V2VVMwareStatus.fromString(iGetIn(statusField, ['value', 'value']));
    const StatusComponent =
      vmwareStatusComponentResolver[status && status.getValue()] || ConnectionUnknown;

    return (
      <FormFieldRow field={statusField}>
        <StatusComponent />
      </FormFieldRow>
    );
  },
);

type VMWareObjectStatusConnectedProps = {
  statusField: any;
};

const stateToProps = (state, { wizardReduxID }) => ({
  statusField: iGetVMWareField(state, wizardReduxID, VMWareProviderField.STATUS),
});

export const VMWareObjectStatus = connect(stateToProps)(VMWareObjectStatusConnected);
