import * as React from 'react';
import { connect } from 'react-redux';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  Title,
} from '@patternfly/react-core';
import { iGetCommonData } from '../../selectors/immutable/selectors';
import { VMWizardProps, VMWizardTab } from '../../types';
import { getVMLikeModelName } from '../../../../utils/utils';
import { iGetIn } from '../../../../utils/immutable';
import { iGetCreateVMWizardTabs } from '../../selectors/immutable/common';

const ErrorResultsComponent: React.FC<ErrorResultsProps> = ({
  isCreateTemplate,
  mainError,
  className,
}) => {
  const modelName = getVMLikeModelName(isCreateTemplate);

  return (
    <EmptyState variant={EmptyStateVariant.full} className={className}>
      <EmptyStateIcon icon={ExclamationCircleIcon} color="#a30000" />
      <Title headingLevel="h5" size="lg" data-test-id="kubevirt-wizard-error-result">
        {`Error creating ${modelName}.`}
      </Title>
      <EmptyStateBody>{mainError}</EmptyStateBody>
    </EmptyState>
  );
};

type ErrorResultsProps = {
  wizardReduxID: string;
  isCreateTemplate: boolean;
  mainError: string;
  className?: string;
};

const stateToProps = (state, { wizardReduxID }) => {
  const stepData = iGetCreateVMWizardTabs(state, wizardReduxID);
  return {
    isCreateTemplate: iGetCommonData(state, wizardReduxID, VMWizardProps.isCreateTemplate),
    mainError: iGetIn(stepData, [VMWizardTab.RESULT, 'value', 'mainError']),
  };
};

export const ErrorResults = connect(stateToProps)(ErrorResultsComponent);
