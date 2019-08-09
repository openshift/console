import * as React from 'react';
import * as _ from 'lodash';
import { CancelAcceptButtons, Dropdown, getResource, Text } from 'kubevirt-web-ui-components';
import { connect } from 'react-redux';
import { TableData, TableRow } from '@console/internal/components/factory';
import { Firehose, FirehoseResult, LoadingInline } from '@console/internal/components/utils';
import { FormGroup, HelpBlock } from 'patternfly-react';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { k8sPatch, K8sResourceKind } from '@console/internal/module/k8s';
import { getNamespace } from '@console/shared';
import { getVMLikeModel } from '../../selectors/selectors';
import { NetworkAttachmentDefinitionModel } from '../../models';
import { getAddNicPatches } from '../../k8s/patches/vm/vm-nic-patches';
import { VMKind, VMLikeEntityKind } from '../../types';
import { getNetworkChoices } from '../../selectors/vm';
import { dimensifyRow } from '../../utils/table';
import { NetworkType } from '../../constants/vm';
import { getValidationErrorMessage, getValidationErrorType } from '../../utils/validations/common';
import { validateMACAddress, validateNicName } from '../../utils/validations/vm';
import { GENERAL_ERROR_MSG } from '../../utils/validations/strings';
import { getDefaultNetworkBinding, getNetworkBindings, nicTableColumnClasses } from './utils';
import { VMNicRowProps } from './types';
import '../vm-disks/_create-device-row.scss';

const createNic = ({
  vmLikeEntity,
  nic,
}: {
  vmLikeEntity: VMLikeEntityKind;
  nic: any;
}): Promise<VMLikeEntityKind> =>
  k8sPatch(getVMLikeModel(vmLikeEntity), vmLikeEntity, getAddNicPatches(vmLikeEntity, nic));

type NetworkColumn = {
  network: string;
  onChange: (string) => void;
  hasNADs: boolean;
  nads: FirehoseResult<K8sResourceKind[]>;
  vm: VMKind;
  creating: boolean;
};

const NetworkColumn: React.FC<NetworkColumn> = ({
  network,
  vm,
  onChange,
  nads,
  hasNADs,
  creating,
}) => {
  if (!hasNADs || nads.loadError || nads.loaded) {
    const loadedNads = _.get(nads, 'data') || [];
    const networkChoices = getNetworkChoices(vm, loadedNads);
    const networkValue =
      network ||
      (networkChoices.length === 0
        ? '--- No Network Definition Available ---'
        : '--- Select Network Definition ---');
    return (
      <Dropdown
        id="nic-network-type"
        choices={networkChoices}
        value={networkValue}
        onChange={onChange}
        disabled={networkChoices.length === 0 || creating}
      />
    );
  }
  return <LoadingInline />;
};

type CreateNicRowProps = VMNicRowProps & { nads?: FirehoseResult<K8sResourceKind[]> };

export const CreateNicRow: React.FC<CreateNicRowProps> = ({
  nads,
  hasNADs,
  customData: {
    vm,
    preferableNicBus,
    vmLikeEntity,
    interfaceLookup,
    onCreateRowDismiss,
    onCreateRowError,
    forceRerender,
  },
  index,
  style,
}) => {
  const [creating, setCreating] = useSafetyFirst(false);
  const [name, setName] = React.useState('');
  const [model] = React.useState(preferableNicBus);
  const [network, setNetwork] = React.useState(null);
  const [binding, setBinding] = React.useState(null);
  const [macAddress, setMacAddress] = React.useState('');
  const networkType = _.get(network, 'networkType');

  const dimensify = dimensifyRow(nicTableColumnClasses);
  const id = 'create-nic-row';

  const nameError = validateNicName(name, interfaceLookup);
  const macAddressError = validateMACAddress(macAddress);
  const isValid = !nameError && !macAddressError && network && binding;

  return (
    <TableRow id={id} index={index} trKey={id} style={style}>
      <TableData className={dimensify()}>
        <FormGroup
          className="kubevirt-vm-create-device-row__cell--no_bottom"
          validationState={getValidationErrorType(nameError)}
        >
          <Text
            id="nic-name"
            disabled={creating}
            onChange={(v) => {
              setName(v);
              forceRerender();
            }}
            value={name}
          />
          <HelpBlock>{getValidationErrorMessage(nameError)}</HelpBlock>
        </FormGroup>
      </TableData>
      <TableData id="nic-model" className={dimensify()}>
        {model}
      </TableData>
      <TableData className={dimensify()}>
        <NetworkColumn
          network={network}
          onChange={(net) => {
            const { networkType: newNetworkType } = net;
            if (newNetworkType === NetworkType.POD) {
              setMacAddress('');
            }

            if (!binding || !getNetworkBindings(newNetworkType).includes(binding)) {
              setBinding(getDefaultNetworkBinding(newNetworkType));
            }

            setNetwork(net);
          }}
          hasNADs={hasNADs}
          nads={nads}
          vm={vm}
          creating={creating}
        />
      </TableData>
      <TableData className={dimensify()}>
        <Dropdown
          id="nic-binding"
          choices={getNetworkBindings(networkType)}
          value={binding || '--- Select binding ---'}
          onChange={setBinding}
          disabled={creating}
        />
      </TableData>
      <TableData className={dimensify()}>
        <FormGroup
          className="kubevirt-vm-create-device-row__cell--no_bottom"
          validationState={getValidationErrorType(macAddressError)}
        >
          <Text
            id="nic-mac-address"
            onChange={(v) => {
              setMacAddress(v);
              forceRerender();
            }}
            value={macAddress}
            disabled={creating || networkType === NetworkType.POD}
          />
          <HelpBlock>{getValidationErrorMessage(macAddressError)}</HelpBlock>
        </FormGroup>
      </TableData>
      <TableData className="kubevirt-vm-create-device-row__confirmation-buttons">
        <CancelAcceptButtons
          onCancel={onCreateRowDismiss}
          onAccept={() => {
            setCreating(true);
            createNic({ vmLikeEntity, nic: { name, model, network, binding, mac: macAddress } })
              .then(onCreateRowDismiss)
              .catch((error) => {
                onCreateRowError((error && error.message) || GENERAL_ERROR_MSG);
                setCreating(false);
              });
          }}
          disabled={!isValid}
        />
      </TableData>
    </TableRow>
  );
};

const CreateNicRowFirehose: React.FC<VMNicRowProps> = (props) => {
  if (props.hasNADs) {
    const resources = [
      getResource(NetworkAttachmentDefinitionModel, {
        namespace: getNamespace(props.customData.vmLikeEntity),
        prop: 'nads',
        optional: true,
      }),
    ];

    return (
      <Firehose resources={resources}>
        <CreateNicRow {...props} />
      </Firehose>
    );
  }

  return <CreateNicRow {...props} />;
};

const stateToProps = ({ k8s }) => {
  return {
    hasNADs: !!k8s.getIn(['RESOURCES', 'models', NetworkAttachmentDefinitionModel.kind]),
  };
};

export const CreateNicRowConnected = connect(stateToProps)(CreateNicRowFirehose);
