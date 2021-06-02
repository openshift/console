import * as React from 'react';
import { connect } from 'react-redux';
import { errorsFirstSort } from '../../../../k8s/enhancedK8sMethods/k8sMethodsUtils';
import { Result } from '../../../../k8s/enhancedK8sMethods/types';
import { iGetIn, immutableListToShallowJS } from '../../../../utils/immutable';
import { iGetCreateVMWizardTabs } from '../../selectors/immutable/common';
import { VMWizardTab } from '../../types';
import { resultContentToString } from '../../utils/utils';
import { ResultTabRow } from './result-tab-row';

const RequestResultsPartComponent: React.FC<RequestResultsPartComponentProps> = ({
  requestResults,
}) => (
  <>
    {errorsFirstSort(requestResults).map(({ content: { data, type }, ...rest }, index) => (
      <ResultTabRow
        key={`${index + 1}`}
        alignMiddle
        content={resultContentToString(data, type)}
        {...rest}
      />
    ))}
  </>
);

type RequestResultsPartComponentProps = {
  requestResults: Result[];
};

const stateToProps = (state, { wizardReduxID }) => {
  const stepData = iGetCreateVMWizardTabs(state, wizardReduxID);
  return {
    requestResults: immutableListToShallowJS(
      iGetIn(stepData, [VMWizardTab.RESULT, 'value', 'requestResults']),
    ),
  };
};

export const RequestResultsPart = connect(stateToProps)(RequestResultsPartComponent);
