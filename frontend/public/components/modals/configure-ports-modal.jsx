import React from 'react';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';

const PortRow = ({name, onChange, autoFocus, containerPort, deleteRow}) => {
  return <div className="row">
    <div className="col-sm-5">
      <input value={name || ''} onChange={event => onChange('name', event)} className="form-control" type="text" autoFocus={autoFocus} />
    </div>
    <div className="col-sm-1"></div>
    <div className="col-sm-5">
      <input value={containerPort || ''} onChange={event => onChange('containerPort', event)} min="0" max="65535" className="form-control co-p-configure-ports__port-number" type="number" />
    </div>
    <div className="col-sm-1 text-center">
      <i onClick={deleteRow} className="fa fa-times co-m-form-row-icon co-m-form-row-icon--clear co-m-form-row-icon--button"></i>
    </div>
  </div>;
};

class ConfigurePortsModal extends React.Component {
  constructor(props) {
    super(props);

    this._cancel = this.props.cancel.bind(this);
    this._addEmptyRow = this._addEmptyRow.bind(this);
    this._submit = this._submit.bind(this);

    let ports = this.props.container.ports;
    if (_.isEmpty(ports)) {
      ports = [{}];
    }

    this.state = {
      ports
    };
  }

  _addEmptyRow() {
    this.setState({
      ports: _.concat(this.state.ports, {})
    });
  }

  _deleteRow(index) {
    let newPorts = this.state.ports.filter((port, i) => i !== index);
    if (newPorts.length === 0) {
      newPorts = [{}];
    }
    this.setState({
      ports: newPorts
    });
  }

  _change(index, field, event) {
    const ports = this.state.ports.slice();
    let value = event.target.value;
    const numberValue = _.toNumber(value);
    if (_.isFinite(numberValue)) {
      value = numberValue;
    }
    _.set(ports, [index, field], value);
    this.setState({
      ports
    });
  }

  _submit(event) {
    event.preventDefault();

    const ports = _.filter(this.state.ports, port => port && (port.name || port.containerPort));
    this.props.close(ports);
  }

  render() {
    return <form onSubmit={this._submit} name="form">
      <ModalTitle>Configure Container Ports</ModalTitle>
      <ModalBody>
        <div className="co-m-form-row">
          <p>Network traffic will be allowed into the container over the following ports:</p>
        </div>
        <div className="co-m-table-grid co-m-table-grid--bordered co-m-table-grid--compact">
          <div className="row co-m-table-grid__head">
            <div className="col-sm-5">Name</div>
            <div className="col-sm-1"></div>
            <div className="col-sm-5">Container Port</div>
            <div className="col-sm-1"></div>
          </div>

          <div className="co-m-table-grid__body">
            {this.state.ports.map((port, index) => {
              const autoFocus = index === 0;
              return <PortRow key={index} {...port} autoFocus={autoFocus} deleteRow={this._deleteRow.bind(this, index)} onChange={this._change.bind(this, index)} />;
            })}
          </div>

          <div className="row co-m-table-grid__footer">
            <div className="col-sm-12">
              <button onClick={this._addEmptyRow} type="button" className="btn btn-link"><i className="fa fa-plus"></i>&nbsp;Add another</button>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalSubmitFooter submitText="Save Port Configuration" cancel={this._cancel} />
    </form>;
  }
}

export const configurePortsModal = createModalLauncher(ConfigurePortsModal);
