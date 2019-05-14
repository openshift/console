import * as React from 'react';
import * as _ from 'lodash-es';
import { Checkbox, Icon } from 'patternfly-react';

import { RH_OPERATOR_SUPPORT_POLICY_LINK } from '../../const';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { ExternalLink } from '../utils';

export class OperatorHubCommunityProviderModal extends React.Component<OperatorHubCommunityProviderModalProps, OperatorHubCommunityProviderModalState> {
  constructor(props) {
    super(props);
    this.state = {
      ignoreWarnings: false,
    };
  }

  onIgnoreChange = (event) => {
    this.setState({ ignoreWarnings: _.get(event, 'target.checked', false) });
  };

  submit = (event) => {
    event.preventDefault();
    this.props.showCommunityOperators(this.state.ignoreWarnings);
    this.props.close();
  };

  render() {
    const { ignoreWarnings } = this.state;
    const submitButtonContent = <React.Fragment>Continue</React.Fragment>;
    return <form onSubmit={this.submit} className="modal-content co-modal-ignore-warning">
      <ModalTitle>Show Community Operator</ModalTitle>
      <ModalBody className="modal-body">
        <div className="co-modal-ignore-warning__content">
          <div className="co-modal-ignore-warning__icon">
            <Icon type="pf" name="info" />
          </div>
          <div>
            <p>
              Community Operators are operators which have not been vetted or verified by Red Hat.  Community Operators should be used with
              caution because their stability is unknown.  Red Hat provides no support for Community Operators.
              {RH_OPERATOR_SUPPORT_POLICY_LINK && (
                <span className="co-modal-ignore-warning__link">
                  <ExternalLink href={RH_OPERATOR_SUPPORT_POLICY_LINK} text="Learn more about Red Hat’s third party software support policy" />
                </span>
              )}
            </p>
            <Checkbox className="co-modal-ignore-warning__checkbox" onChange={this.onIgnoreChange} checked={ignoreWarnings}>
              Do not show this warning again
            </Checkbox>
          </div>
        </div>
      </ModalBody>
      <ModalSubmitFooter submitText={submitButtonContent} inProgress={false} errorMessage="" cancel={this.props.close} />
    </form>;
  }
}

export type OperatorHubCommunityProviderModalProps = {
  showCommunityOperators: (ignoreWarnings: boolean) => void;
  close: () => void;
};

export type OperatorHubCommunityProviderModalState = {
  ignoreWarnings: boolean;
};

export const communityOperatorWarningModal = createModalLauncher(OperatorHubCommunityProviderModal);
