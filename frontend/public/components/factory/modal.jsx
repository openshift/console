import React from 'react';
import ReactDOM from 'react-dom';
import Modal from 'react-modal';

import { ButtonBar, ErrorMessage } from '../utils';

export const createModalLauncher = (Component) => (props) => {
  const modalContainer = document.getElementById('modal-container');

  const result = new Promise((resolve, reject) => {
    const wrapper = <ModalWrapper
      Component={Component}
      componentProps={props || {}}
      isOpen={true}
      resolve={resolve}
      reject={reject} />;
    ReactDOM.render(wrapper, modalContainer);
  });
  return {result};
};

export const ModalTitle = ({children}) => <div className="modal-header"><h4 className="modal-title">{children}</h4></div>;

export const ModalBody = ({children}) => <div className="modal-body">{children}</div>;

export const ModalFooter = ({message, errorMessage, inProgress, children}) => {
  return <ButtonBar className="modal-footer" message={message} inProgress={inProgress}>
    <ErrorMessage errorMessage={errorMessage} />
    {children}
  </ButtonBar>;
};

export const ModalSubmitFooter = ({message, errorMessage, inProgress, cancel, submitText, submitDisabled}) => {
  return <ModalFooter inProgress={inProgress} errorMessage={errorMessage} message={message}>
    <button type="submit" className="btn btn-primary" disabled={submitDisabled}>{submitText}</button>
    <button type="button" onClick={cancel} className="btn btn-link">Cancel</button>
  </ModalFooter>;
};

ModalSubmitFooter.propTypes = {
  cancel: React.PropTypes.func.isRequired,
  errorMessage: React.PropTypes.string.isRequired,
  inProgress: React.PropTypes.bool.isRequired,
  message: React.PropTypes.string,
  submitText: React.PropTypes.node.isRequired,
};

export class ModalWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isModalOpen: this.props.isOpen,
    };

    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.dismissModal = this.dismissModal.bind(this);
    this.cleanupDOM = this.cleanupDOM.bind(this);
  }

  cleanupDOM() {
    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(this).parentNode);
  }

  openModal() {
    this.setState({ isModalOpen: true });
  }

  closeModal(e) {
    // Disable closing the modal with the escape key for "blocking" modals
    if (this.props.componentProps.blocking && _.get(e, 'type') === 'keydown') {
      return;
    }
    this.setState({ isModalOpen: false });
    this.cleanupDOM();
    this.props.resolve();
  }

  dismissModal() {
    this.setState({ isModalOpen: false });
    this.cleanupDOM();
    this.props.reject();
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      isModalOpen: nextProps.isOpen
    });
  }

  componentWillUnmount() {
    this.cleanupDOM();
  }

  render() {
    const {componentProps, Component} = this.props;

    return <Modal
      isOpen={this.state.isModalOpen}
      contentLabel="Modal"
      onRequestClose={this.closeModal}
      className="co-modal"
      overlayClassName="co-overlay"
      shouldCloseOnOverlayClick={!componentProps.blocking}>
      <div className="modal-dialog">
        <div className="modal-content">
          <Component {...componentProps} cancel={this.closeModal} close={this.closeModal} />
        </div>
      </div>
    </Modal>;
  }
}
