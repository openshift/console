/* eslint-disable no-undef */
import * as React from 'react';
import * as _ from 'lodash-es';
import { Checkbox, Icon, MessageDialog } from 'patternfly-react';

import { RH_OPERATOR_SUPPORT_POLICY_LINK } from '../../const';
import { ExternalLink } from '../utils';

export class OperatorHubCommunityProviderModal extends React.Component<MarketplaceCommunityProviderModalProps, MarketplaceCommunityProviderModalState> {
  constructor(props) {
    super(props);
    this.state = {
      ignoreWarnings: false,
    };
  }

  componentDidUpdate(prevProps) {
    const { show } = this.props;
    const { ignoreWarnings } = this.state;
    if (show && !prevProps.show && ignoreWarnings) {
      this.setState({ignoreWarnings: false });
    }
  }

  onIgnoreChange = (event) => {
    this.setState({ ignoreWarnings: _.get(event, 'target.checked', false) });
  };

  render() {
    const {show, close} = this.props;
    const { ignoreWarnings } = this.state;

    const messageText = (
      <p>
        These are operators which have not been vetted or verified by Red Hat.  Community Operators should be used with
        caution because their stability is unknown.  Red Hat provides no support for Community Operators.
        {RH_OPERATOR_SUPPORT_POLICY_LINK && (
          <span className="co-modal-ignore-warning__link">
            <ExternalLink href={RH_OPERATOR_SUPPORT_POLICY_LINK} text="Learn more about Red Hat’s third party software support policy" />
          </span>
        )}
        Do you want to show Community Operators in the Operator Hub?
      </p>
    );

    const ignoreWarningsContent = (
      <Checkbox className="co-modal-ignore-warning__checkbox" onChange={this.onIgnoreChange} checked={ignoreWarnings}>
        Do not show this warning again
      </Checkbox>
    );

    return <MessageDialog
      className="co-modal-ignore-warning"
      show={show === true}
      onHide={() => close(false, false)}
      primaryAction={() => close(true, ignoreWarnings)}
      secondaryAction={() => close(false, false)}
      primaryActionButtonContent="Show Community Operators"
      secondaryActionButtonContent="Cancel"
      title="Show Community Operators"
      icon={<Icon type="pf" name="info" />}
      primaryContent={messageText}
      secondaryContent={ignoreWarningsContent}
      accessibleName="communityProviderWarningDialog"
      accessibleDescription="communityProviderWarningContent"
    />;
  }
}

export type MarketplaceCommunityProviderModalProps = {
  show: boolean;
  close: (show: boolean, ignoreWarnings: boolean) => void;
};

export type MarketplaceCommunityProviderModalState = {
  ignoreWarnings: boolean;
};
