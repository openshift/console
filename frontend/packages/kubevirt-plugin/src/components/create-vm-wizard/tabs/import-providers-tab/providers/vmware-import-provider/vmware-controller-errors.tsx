import * as React from 'react';
import { connect } from 'react-redux';
import { AlertVariant } from '@patternfly/react-core';
import { iGetVMWareFieldAttribute } from '../../../../selectors/immutable/provider/vmware/selectors';
import { VMWareProviderField } from '../../../../types';
import { Errors } from '../../../../../errors/errors';
import { toShallowJS } from '../../../../../../utils/immutable';
import { ResultsWrapper } from '../../../../../../k8s/enhancedK8sMethods/types';
import { errorsFirstSort } from '../../../../../../k8s/enhancedK8sMethods/k8sMethodsUtils';
import { ResultTabRow } from '../../../result-tab/result-tab-row';
import { resultContentToString } from '../../../../utils/utils';

const VMWareControllerErrorsComponent: React.FC<VMWareControllerErrorsComponentProps> = React.memo(
  ({ errors }) => {
    if (!errors) {
      return null;
    }
    const resultWrapper: ResultsWrapper = toShallowJS(errors);
    if (resultWrapper.isValid) {
      return null;
    }

    return (
      <div id="v2v-vmware-error">
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

type VMWareControllerErrorsComponentProps = {
  errors: any;
};

const stateToProps = (state, { wizardReduxID }) => ({
  errors: iGetVMWareFieldAttribute(
    state,
    wizardReduxID,
    VMWareProviderField.V2V_LAST_ERROR,
    'errors',
  ),
});

export const VMWareControllerErrors = connect(stateToProps)(VMWareControllerErrorsComponent);
