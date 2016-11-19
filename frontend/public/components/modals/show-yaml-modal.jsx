import React from 'react';

import yamlize from '../../module/service/yamlize';
import { createModalLauncher, ModalTitle, ModalBody, ModalFooter } from '../factory/modal';

class ShowYamlModal extends React.Component {
  constructor(props) {
    super(props);

    this._selectAll = this._selectAll.bind(this);
    this.state = this._generateState();
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this._generateState(nextProps));
  }

  _generateState(props = this.props) {
    return {
      yaml: `${yamlize(props.obj)}\n`
    };
  }

  _selectAll(event) {
    event.target.select();
    event.preventDefault();
    event.stopPropagation();
  }

  render() {
    const blob = new Blob([this.state.yaml], {type: 'text/plain'});
    const downloadURL = URL.createObjectURL(blob);
    const name = _.get(this.props.obj, 'metadata.name', 'resource');

    return <div role="document">
      <ModalTitle>View YAML</ModalTitle>
      <ModalBody>
        <textarea className="form-control co-m-code-box co-m-code-box--copy"
            spellCheck="false"
            onClick={this._selectAll}
            readOnly={true}
            value={this.state.yaml} />
      </ModalBody>
      <ModalFooter>
        <a href={downloadURL} download={`${name}.yaml`} className="btn btn-primary">Download</a>
        <button type="button" onClick={this.props.cancel} className="btn btn-link">Cancel</button>
      </ModalFooter>
    </div>;
  }
}

export const showYamlModal = createModalLauncher(ShowYamlModal);
