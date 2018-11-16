import React from 'react';
import PropTypes from 'prop-types';
import * as _ from 'lodash';
import { Form } from 'patternfly-react';

import { PromiseComponent } from '../utils/okdutils';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/okdfactory';
import { k8sPatch } from '../../module/okdk8s';
import { VirtualMachineModel } from '../../models';
import { NIC, DISK } from '../utils/constants';

class DeleteDeviceModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this._cancel = this.props.cancel.bind(this);
    this._submit = this.submit.bind(this);
  }

  submit(event) {
    event.preventDefault();
    const { vm, type, device } = this.props;

    const deviceType = type === NIC ? {type: 'interfaces', spec: 'networks'} : { type: 'disks', spec: 'volumes'};
    const devices = _.get(vm, `spec.template.spec.domain.devices.${deviceType.type}`, []);

    const deviceIndex = devices.findIndex(d => d.name === device.name);
    const specIndex = _.get(vm, `spec.template.spec.${deviceType.spec}`,[]).findIndex(spec => spec.name === device.name || spec.name === device.volumeName);

    const patch = [];

    if (deviceIndex !== -1) {
      patch.push({
        op: 'remove',
        path: `/spec/template/spec/domain/devices/${deviceType.type}/${deviceIndex}`,
      });
    }

    if (specIndex !== -1) {
      patch.push({
        op: 'remove',
        path: `/spec/template/spec/${deviceType.spec}/${specIndex}`,
      });
    }

    // disk may have dataVolumeTemplate defined that should be deleted too
    if (type === DISK && _.get(device, 'volume.dataVolume') && _.get(vm, 'spec.dataVolumeTemplates')) {
      const dataVolumeIndex = vm.spec.dataVolumeTemplates.findIndex(dataVolume => _.get(dataVolume, 'metadata.name') === device.volume.dataVolume.name);
      if (dataVolumeIndex !== -1) {
        patch.push({
          op: 'remove',
          path: `/spec/dataVolumeTemplates/${dataVolumeIndex}`,
        });
      }
    }

    // if pod network is deleted, we need to set autoAttachPodInterface to false
    if (type === NIC && _.get(device, 'network.pod')) {
      const op = _.has(vm, 'spec.domain.devices.autoAttachPodInterface') ? 'replace' : 'add';
      patch.push({
        op,
        path: '/spec/template/spec/domain/devices/autoAttachPodInterface',
        value: false,
      });
    }

    if (patch.length === 0) {
      this.props.close();
    } else {
      const promise = k8sPatch(VirtualMachineModel, vm, patch);
      this.handlePromise(promise).then(this.props.close);
    }
  }

  render() {
    const {vm, device} = this.props;
    return <Form onSubmit={this._submit}>
      <ModalTitle>Delete {device.name} from {vm.metadata.name}</ModalTitle>
      <ModalBody>
        Are you sure you want to delete <strong>{device.name}</strong>
        <span> from  <strong>{vm.metadata.name} </strong>?</span>
      </ModalBody>
      <ModalSubmitFooter errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} submitText={'Delete'} cancel={this._cancel} />
    </Form>;
  }
}

DeleteDeviceModal.propTypes = {
  device: PropTypes.object.isRequired,
  vm: PropTypes.object.isRequired,
  type: PropTypes.string.isRequired,
  close: PropTypes.func.isRequired,
};

export const deleteDeviceModal = createModalLauncher(DeleteDeviceModal);
