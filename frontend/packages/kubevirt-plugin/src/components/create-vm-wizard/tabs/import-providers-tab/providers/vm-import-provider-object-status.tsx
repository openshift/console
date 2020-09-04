import { Alert, AlertVariant } from '@patternfly/react-core';
import { InProgressIcon } from '@patternfly/react-icons';
import StatusIconAndText from '@console/shared/src/components/status/StatusIconAndText';
import * as React from 'react';
import { connect } from 'react-redux';
import { V2VProviderStatus } from '../../../../../statuses/v2v';
import { OvirtProviderField, VMImportProvider, VMWareProviderField } from '../../../types';
import { FormFieldRow } from '../../../form/form-field-row';
import { iGet } from '../../../../../utils/immutable';
import { iGetProviderField } from '../../../selectors/immutable/provider/common';
import { getProviderEndpointName } from '../../../strings/import-providers';

type StatusProps = {
  provider: VMImportProvider;
};

const CheckingCredentials: React.FC<StatusProps> = ({ provider }) => (
  <StatusIconAndText
    spin
    noTooltip
    title={`Checking ${getProviderEndpointName(provider)} credentials`}
    icon={<InProgressIcon />}
  />
);

const LoadingData: React.FC<StatusProps> = () => (
  <StatusIconAndText
    spin
    noTooltip
    title="Connection successful. Loading data"
    icon={<InProgressIcon />}
  />
);

const ConnectionFailed: React.FC<StatusProps> = ({ provider }) => (
  <Alert
    isInline
    variant={AlertVariant.warning}
    title={`Could not connect to ${getProviderEndpointName(
      provider,
    )} using the provided credentials.`}
  />
);

const ConnectionFailedInfra: React.FC<StatusProps> = ({ provider }) => (
  <Alert
    isInline
    variant={AlertVariant.warning}
    title={`Provided connection information is not correct. Connection to ${getProviderEndpointName(
      provider,
    )} failed.`}
  />
);

const ConnectionSuccessful: React.FC<StatusProps> = () => <>Connection successful</>;

const ConnectionUnknown: React.FC<StatusProps> = () => <>Status unknown</>;

const ReadVmsListFailed: React.FC<StatusProps> = ({ provider }) => (
  <Alert
    isInline
    variant={AlertVariant.warning}
    title={`Connection succeeded but could not read list of virtual machines from ${getProviderEndpointName(
      provider,
    )} instance`}
  />
);

const ReadVmDetailFailed: React.FC<StatusProps> = ({ provider }) => (
  <Alert
    isInline
    variant={AlertVariant.warning}
    title={`Connection succeeded but could not read detail of virtual machines from ${getProviderEndpointName(
      provider,
    )} instance`}
  />
);

const vmwareStatusComponentResolver = {
  [V2VProviderStatus.CONNECTING.getValue()]: CheckingCredentials,
  [V2VProviderStatus.CONNECTION_TO_API_FAILED.getValue()]: ConnectionFailedInfra,
  [V2VProviderStatus.CONNECTION_FAILED.getValue()]: ConnectionFailed,
  [V2VProviderStatus.LOADING_VMS_LIST.getValue()]: LoadingData,
  [V2VProviderStatus.LOADING_VMS_LIST_FAILED.getValue()]: ReadVmsListFailed,
  [V2VProviderStatus.LOADING_VM_DETAIL.getValue()]: LoadingData,
  [V2VProviderStatus.LOADING_VM_DETAIL_FAILED.getValue()]: ReadVmDetailFailed,
  [V2VProviderStatus.CONNECTION_SUCCESSFUL.getValue()]: ConnectionSuccessful,
  [V2VProviderStatus.UNKNOWN.getValue()]: ConnectionUnknown,
};

// see onVmwareCheckConnection() for details
const VMWareObjectStatusConnected: React.FC<VMWareObjectStatusConnectedProps> = React.memo(
  ({ statusField, provider }) => {
    const status = V2VProviderStatus.fromString(iGet(statusField, 'value'));
    const StatusComponent = vmwareStatusComponentResolver[status?.getValue()] || ConnectionUnknown;

    return (
      <FormFieldRow field={statusField}>
        <StatusComponent provider={provider} />
      </FormFieldRow>
    );
  },
);

type VMWareObjectStatusConnectedProps = {
  statusField: any;
  provider: VMImportProvider;
};

const stateToProps = (state, { wizardReduxID, provider }) => ({
  statusField: iGetProviderField(
    state,
    wizardReduxID,
    provider,
    OvirtProviderField.STATUS,
    VMWareProviderField.STATUS,
  ),
});

export const VMImportProviderObjectStatus = connect(stateToProps)(VMWareObjectStatusConnected);
