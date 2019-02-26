import React from 'react';
import PropTypes from 'prop-types';
import * as _ from 'lodash-es';
import { Form } from 'patternfly-react';
import { addPrefixToPatch, getName, getDeviceBootOrderPatch } from 'kubevirt-web-ui-components';

import { PromiseComponent } from '../utils/okdutils';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/okdfactory';
import { k8sPatch } from '../../module/okdk8s';
import { VirtualMachineModel, VmTemplateModel } from '../../models';
import { NIC, DISK } from '../utils/constants';

class DeleteDeviceModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this._cancel = this.props.cancel.bind(this);
    this._submit = this.submit.bind(this);
  }

  submit(event) {
    event.preventDefault();
    const { vm, vmTemplate, type, device, patchPrefix } = this.props;

    const deviceType = type === NIC ? {type: 'interfaces', spec: 'networks'} : { type: 'disks', spec: 'volumes'};
    const devices = _.get(vm, `spec.template.spec.domain.devices.${deviceType.type}`, []);

    const deviceIndex = devices.findIndex(d => d.name === device.name);
    const specIndex = _.get(vm, `spec.template.spec.${deviceType.spec}`,[]).findIndex(spec => spec.name === device.name);

    let patch = [];

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

    // if pod network is deleted, we need to set autoattachPodInterface to false
    if (type === NIC && _.get(device, 'network.pod')) {
      const op = _.has(vm, 'spec.domain.devices.autoattachPodInterface') ? 'replace' : 'add';
      patch.push({
        op,
        path: '/spec/template/spec/domain/devices/autoattachPodInterface',
        value: false,
      });
    }

    const bootOrderIndex = _.get(device, 'bootOrder', -1);
    if (bootOrderIndex !== -1) {
      patch = patch.concat(getDeviceBootOrderPatch(vm, deviceType.type, device.name));
    }

    if (patch.length === 0) {
      this.props.close();
    } else {
      const model = vmTemplate ? VmTemplateModel : VirtualMachineModel;
      const obj = vmTemplate || vm;
      const finalPatch = patch.map(p => addPrefixToPatch(patchPrefix, p));

      const promise = k8sPatch(model, obj, finalPatch);
      this.handlePromise(promise).then(this.props.close);
    }
  }

  render() {
    const {vm, vmTemplate, device} = this.props;
    const deviceName = device.name;
    const entityName = getName(vmTemplate || vm);

    return (
      <Form onSubmit={this._submit}>
        <ModalTitle>Delete {deviceName} from {entityName}</ModalTitle>
        <ModalBody>
        Are you sure you want to delete <strong>{deviceName}</strong>
          <span> from  <strong>{entityName} </strong>?</span>
        </ModalBody>
        <ModalSubmitFooter errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} submitText={'Delete'} cancel={this._cancel} />
      </Form>
    );
  }
}

DeleteDeviceModal.propTypes = {
  device: PropTypes.object.isRequired,
  vm: PropTypes.object.isRequired,
  vmTemplate: PropTypes.object, // the template of the vm
  type: PropTypes.string.isRequired,
  close: PropTypes.func.isRequired,
  patchPrefix: PropTypes.string, // path to the vm in the template
};

DeleteDeviceModal.defaultProps = {
  vmTemplate: null,
  patchPrefix: '',
};

export const deleteDeviceModal = createModalLauncher(DeleteDeviceModal);
