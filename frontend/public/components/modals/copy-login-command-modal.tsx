/* eslint-disable no-undef, no-unused-vars */
import * as _ from 'lodash-es';
import * as React from 'react';
import * as Modal from 'react-modal';

import { ModalTitle, ModalBody, ModalFooter } from '../factory/modal';
import { CopyToClipboard } from '../utils/copy-to-clipboard';

type CopyModalProps = {
  isOpen: boolean,
  closeCopyLoginCommand: Function,
  username: string,
};

type CopyModalState = {
  token: string,
};

const apiServerURL = (window as any).SERVER_FLAGS.kubeAPIServerURL;
const tokenCookiePrefix = 'openshift-session-token=';

export class CopyLoginCommandModal extends React.Component <CopyModalProps, CopyModalState> {
  constructor(props) {
    super(props);
    this.state = {
      token: null,
    };
    this.handleToken = this.handleToken.bind(this);
  }
  handleToken() {
    const iframe = window.document.getElementById('apiIframe');
    const cookies = (iframe as any).contentDocument.cookie;
    const openshiftToken = cookies.split(';')
      .map(c => _.trim(c))
      .filter(c => c.startsWith(tokenCookiePrefix))
      .map(c => c.slice(tokenCookiePrefix.length)).pop();
    this.setState({ token: openshiftToken });
  }
  render() {
    const {isOpen, closeCopyLoginCommand, username } = this.props;
    const loginCommand = `oc login ${apiServerURL} ${this.state.token ? `--token=${this.state.token}` : ''}`;
    const obfuscatedLoginCommand = `oc login ${apiServerURL} --token=<hidden>`;
    const modalContainer = document.getElementById('modal-container');
    const iframeSrc = `${window.location.origin}/api`;
    const onCloseClick = e => {
      e.stopPropagation();
      closeCopyLoginCommand(e);
    };
    Modal.setAppElement(modalContainer);
    return (
      <Modal
        isOpen={isOpen}
        contentLabel="Modal"
        onRequestClose={closeCopyLoginCommand}
        className="modal-dialog"
        overlayClassName="co-overlay"
        shouldCloseOnOverlayClick={true}>
        <div className="modal-content">
          <ModalTitle>Copy Login Command</ModalTitle>
          <ModalBody className="modal-body">
            <div className="co-copy-login-command-modal">
              <p>
                <span aria-hidden="true" className="co-copy-login-command-modal__icon pficon pficon-warning-triangle-o"></span>&nbsp;
                A token is a form of a password. Do not share your API Token.
              </p>
              <p>
                Copy the following command and appended token to login as user <b>{`${username}`}</b> through the CLI.
              </p>
              <iframe id="apiIframe" onLoad={this.handleToken} style={{display:'none'}} src={`${iframeSrc}`} ></iframe>
              <CopyToClipboard value={loginCommand} visibleValue={obfuscatedLoginCommand} />
            </div>
          </ModalBody>
          <ModalFooter inProgress={false} errorMessage=""><button type="button" onClick={onCloseClick} className="btn btn-default btn-primary">Close</button></ModalFooter>
        </div>
      </Modal>
    );
  }
}
