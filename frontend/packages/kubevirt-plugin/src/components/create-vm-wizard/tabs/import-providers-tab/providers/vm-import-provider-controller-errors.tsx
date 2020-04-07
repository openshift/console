import * as React from 'react';
import { connect } from 'react-redux';
import { AlertVariant } from '@patternfly/react-core';
import {
  ImportProvidersField,
  OvirtProviderField,
  VMImportProvider,
  VMWareProviderField,
} from '../../../types';
import { Errors } from '../../../../errors/errors';
import { iGetIn, toShallowJS } from '../../../../../utils/immutable';
import { ResultsWrapper } from '../../../../../k8s/enhancedK8sMethods/types';
import { errorsFirstSort } from '../../../../../k8s/enhancedK8sMethods/k8sMethodsUtils';
import { ResultTabRow } from '../../result-tab/result-tab-row';
import { resultContentToString } from '../../../utils/utils';
import { iGetImportProviders } from '../../../selectors/immutable/import-providers';

const VmImportProviderControllerErrorsComponent: React.FC<VmImportProviderControllerErrorsComponentProps> = React.memo(
  ({ errors, provider }) => {
    if (!errors) {
      return null;
    }
    const resultWrapper: ResultsWrapper = toShallowJS(errors);
    if (resultWrapper.isValid) {
      return null;
    }

    return (
      <div id={`v2v-${provider.toLowerCase()}-error`}>
        <Errors
          errors={[
            { title: 'Error', message: resultWrapper.mainError },
            ...resultWrapper.errors,
          ].map((error) => ({
            ...error,
            variant: AlertVariant.danger,
          }))}
        />
        {errorsFirstSort(resultWrapper.requestResults).map(
          ({ content: { data, type }, ...rest }, index) => (
            <ResultTabRow
              key={`${index + 1}`}
              content={resultContentToString(data, type)}
              {...rest}
            />
          ),
        )}
      </div>
    );
  },
);

type VmImportProviderControllerErrorsComponentProps = {
  errors: any;
  provider: VMImportProvider;
};

const stateToProps = (state, { wizardReduxID, provider }) => ({
  errors: iGetIn(iGetImportProviders(state, wizardReduxID), [
    ImportProvidersField.PROVIDERS_DATA,
    provider,
    provider === VMImportProvider.OVIRT
      ? OvirtProviderField.CONTROLLER_LAST_ERROR
      : VMWareProviderField.CONTROLLER_LAST_ERROR,
    'errors',
  ]),
});

export const VMImportProviderControllerErrors = connect(stateToProps)(
  VmImportProviderControllerErrorsComponent,
);
