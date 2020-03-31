import { connect } from 'react-redux';
import * as React from 'react';
import {
  iGetOvirtData,
  isOvirtProvider,
} from '../../../../selectors/immutable/provider/ovirt/selectors';
import { VMImportProvider, OvirtProviderField } from '../../../../types';
import { vmWizardActions } from '../../../../redux/actions';
import { ActionType } from '../../../../redux/types';
import { iGet, iGetIn } from '../../../../../../utils/immutable';
import { FormFieldReviewContext } from '../../../../form/form-field-review-context';
import { VMImportProviderControllerStatusRow } from '../vm-import-provider-controller-status-row';
import { VMImportProviderControllerErrors } from '../vm-import-provider-controller-errors';

class OvirtImportProviderConnected extends React.Component<OvirtImportProviderProps> {
  // helpers
  getField = (key: OvirtProviderField) => iGet(this.props.ovirtData, key);

  getValue = (key: OvirtProviderField) => iGetIn(this.props.ovirtData, [key, 'value']);

  onChange = (key: OvirtProviderField) => (value) => this.props.onFieldChange(key, { value });

  render() {
    const { wizardReduxID, isOvirt } = this.props;

    if (!isOvirt) {
      return null;
    }

    return (
      <FormFieldReviewContext.Consumer>
        {({ isReview }: { isReview: boolean }) => (
          <>
            {!isReview && (
              <>
                <VMImportProviderControllerErrors
                  key="errors"
                  wizardReduxID={wizardReduxID}
                  provider={VMImportProvider.OVIRT}
                />
                <VMImportProviderControllerStatusRow
                  key="controllerstatus-row"
                  wizardReduxID={wizardReduxID}
                  provider={VMImportProvider.OVIRT}
                  id="vm-import-controller-status"
                />
              </>
            )}
          </>
        )}
      </FormFieldReviewContext.Consumer>
    );
  }
}

type OvirtImportProviderProps = {
  isOvirt: boolean;
  ovirtData: any;
  wizardReduxID: string;
  onFieldChange: (key: OvirtProviderField, value: any) => void;
};

const stateToProps = (state, { wizardReduxID }) => ({
  isOvirt: isOvirtProvider(state, wizardReduxID),
  ovirtData: iGetOvirtData(state, wizardReduxID),
});

const dispatchToProps = (dispatch, { wizardReduxID }) => ({
  onFieldChange: (key: OvirtProviderField, value: any) =>
    dispatch(
      vmWizardActions[ActionType.UpdateImportProviderField](
        wizardReduxID,
        VMImportProvider.OVIRT,
        key,
        value,
      ),
    ),
});

export const OvirtImportProvider = connect(
  stateToProps,
  dispatchToProps,
)(OvirtImportProviderConnected);
