// FOR DEMO PURPOSES ONLY

import * as React from 'react';

import store from '../../redux';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { Dropdown } from '../utils';
import { UIActions } from '../../ui/ui-actions';

const MOCK_UPDATES = {
  '4.0.0-0.alpha-2018-12-10-123456': '4.0.0-0.alpha-2018-12-10-123456',
  '4.0.0': '4.0.0',
  '4.0.1': '4.0.1',
};

class MockClusterUpdateModal extends React.Component {
  constructor(props) {
    super(props);
    this._submit = this._submit.bind(this);
    this._cancel = props.cancel.bind(this);
    this._change = this._change.bind(this);
    this.state = {
      value: MOCK_UPDATES['4.0.0-0.alpha-2018-12-10-123456'],
    };
  }

  _submit(e) {
    const {value} = this.state;
    e.preventDefault();
    store.dispatch(UIActions.startMockClusterUpgrade(value));
    setTimeout(()=>store.dispatch(UIActions.completeMockClusterUpgrade(value)), 10000);
    this.props.close();
  }

  _cancel() {
    this.props.close();
  }

  _change(value) {
    this.setState({value});
  }

  render() {
    const {currentVersion} = this.props;
    return <form onSubmit={this._submit} name="form">
      <ModalTitle>Update Cluster</ModalTitle>
      <ModalBody>
        <div className="form-group">
          <label>
            Current Version
          </label>
          <p>
            {currentVersion}
          </p>
        </div>
        <div className="form-group">
          <label htmlFor="version_dropdown" className="control-label">
            Select New Version
          </label>
          <Dropdown
            className="cluster-update-modal__dropdown"
            id="version_dropdown"
            items={MOCK_UPDATES}
            onChange={this._change}
            title={this.state.value}
          />
        </div>
      </ModalBody>
      <ModalSubmitFooter errorMessage={''} inProgress={false} submitText="Update" cancel={this._cancel} />
    </form>;
  }
}

export const mockClusterUpdateModal = createModalLauncher(MockClusterUpdateModal);
