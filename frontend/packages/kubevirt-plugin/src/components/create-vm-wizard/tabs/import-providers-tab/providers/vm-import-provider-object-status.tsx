import * as React from 'react';
import { Alert, AlertVariant } from '@patternfly/react-core';
import { InProgressIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import StatusIconAndText from '@console/shared/src/components/status/StatusIconAndText';
import { V2VProviderStatus } from '../../../../../statuses/v2v';
import { iGet } from '../../../../../utils/immutable';
import { FormFieldRow } from '../../../form/form-field-row';
import { iGetProviderField } from '../../../selectors/immutable/provider/common';
import { getProviderEndpointName } from '../../../strings/import-providers';
import { OvirtProviderField, VMImportProvider, VMWareProviderField } from '../../../types';

type StatusProps = {
  provider: VMImportProvider;
};

const CheckingCredentials: React.FC<StatusProps> = ({ provider }) => {
  const { t } = useTranslation();
  return (
    <StatusIconAndText
      spin
      noTooltip
      title={t('kubevirt-plugin~Checking {{endpoint}} credentials', {
        endpoint: getProviderEndpointName(provider),
      })}
      icon={<InProgressIcon />}
    />
  );
};

const LoadingData: React.FC<StatusProps> = (props) => {
  const { t } = useTranslation();
  return props.provider === VMImportProvider.OVIRT ? (
    CheckingCredentials(props)
  ) : (
    <StatusIconAndText
      spin
      noTooltip
      title={t('kubevirt-plugin~Connection successful. Loading data')}
      icon={<InProgressIcon />}
    />
  );
};

const ConnectionFailed: React.FC<StatusProps> = ({ provider }) => {
  const { t } = useTranslation();
  return (
    <Alert
      isInline
      variant={AlertVariant.warning}
      title={t(
        'kubevirt-plugin~Cloud not connect to {{ providerName }} using the provided credentials.',
        { providerName: getProviderEndpointName(provider) },
      )}
    />
  );
};

const ConnectionFailedInfra: React.FC<StatusProps> = ({ provider }) => {
  const { t } = useTranslation();
  return (
    <Alert
      isInline
      variant={AlertVariant.warning}
      title={t(
        'kubevirt-plugin~Provided connection information is not correct. Connection to {{ providerName }} failed.',
        { providerName: getProviderEndpointName(provider) },
      )}
    />
  );
};

const ConnectionSuccessful: React.FC<StatusProps> = () => {
  const { t } = useTranslation();
  return t('kubevirt-plugin~Connection successful');
};

const ConnectionUnknown: React.FC<StatusProps> = () => {
  const { t } = useTranslation();
  return t('kubevirt-plugin~Status unknown');
};

const ReadVmsListFailed: React.FC<StatusProps> = () => {
  const { t } = useTranslation();
  return (
    <Alert
      isInline
      variant={AlertVariant.warning}
      title={t(
        "kubevirt-plugin~Connection failed. Please check your credentials and ensure that the API you're attempting to connect to is operational.",
      )}
    />
  );
};

const ReadVmDetailFailed: React.FC<StatusProps> = ({ provider }) => {
  const { t } = useTranslation();
  return (
    <Alert
      isInline
      variant={AlertVariant.warning}
      title={t(
        'kubevirt-plugin~Connection succeeded but could not read detail of virtual machines from {{providerName}} instance',
        { providerName: getProviderEndpointName(provider) },
      )}
    />
  );
};

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
