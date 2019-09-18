import { connect } from 'react-redux';
import { AlertVariant } from '@patternfly/react-core';
import { iGet } from '../../utils/immutable';
import { Errors, Error } from '../errors/errors';
import { COULD_NOT_LOAD_DATA } from '../../utils/strings';
import { CommonDataProp, VMWizardProps } from './types';
import { iGetCommonData } from './selectors/immutable/selectors';

const asError = (state, id: string, key: CommonDataProp, variant?: AlertVariant): Error => {
  const loadError = iGet(iGetCommonData(state, id, key), 'loadError');
  return (
    loadError && {
      message: loadError.message,
      title: COULD_NOT_LOAD_DATA,
      key: key as string,
      variant: variant || AlertVariant.danger,
    }
  );
};

const stateToProps = (state, { wizardReduxID }) => ({
  errors: [
    asError(state, wizardReduxID, VMWizardProps.commonTemplates),
    asError(state, wizardReduxID, VMWizardProps.userTemplates),
    asError(state, wizardReduxID, VMWizardProps.networkAttachmentDefinitions),
    asError(state, wizardReduxID, VMWizardProps.persistentVolumeClaims),
    asError(state, wizardReduxID, VMWizardProps.dataVolumes),
    asError(state, wizardReduxID, VMWizardProps.storageClasses),
    asError(state, wizardReduxID, VMWizardProps.virtualMachines, AlertVariant.warning), // for validation only
  ],
});

export const ResourceLoadErrors = connect(stateToProps)(Errors);
