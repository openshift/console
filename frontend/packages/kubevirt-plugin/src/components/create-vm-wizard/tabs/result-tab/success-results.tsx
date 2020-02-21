import * as React from 'react';
import { connect } from 'react-redux';
import { CheckIcon } from '@patternfly/react-icons';
import {
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateSecondaryActions,
  EmptyStateVariant,
  Title,
} from '@patternfly/react-core';
import { history } from '@console/internal/components/utils';
import { iGetCommonData } from '../../selectors/immutable/selectors';
import { VMSettingsField, VMWizardProps } from '../../types';
import { iGetVmSettingValue } from '../../selectors/immutable/vm-settings';
import {
  getVMLikeModelDetailPath,
  getVMLikeModelListPath,
  getVMLikeModelName,
} from '../../../../utils/utils';

const SuccessResultsComponent: React.FC<SuccessResultsProps> = ({
  isCreateTemplate,
  name,
  namespace,
  className,
}) => {
  const modelName = getVMLikeModelName(isCreateTemplate);
  const modelListPath = getVMLikeModelListPath(isCreateTemplate, namespace);
  const modelDetailPath = getVMLikeModelDetailPath(isCreateTemplate, namespace, name);

  return (
    <EmptyState variant={EmptyStateVariant.full} className={className}>
      <EmptyStateIcon icon={CheckIcon} color="#92d400" />
      <Title headingLevel="h5" size="lg" data-test-id="kubevirt-wizard-success-result">
        {`Successfully created ${modelName}.`}
      </Title>
      <EmptyStateBody>
        You can either go to the details of this {modelName} or see it in the list of available{' '}
        {modelName}s.
      </EmptyStateBody>
      <Button variant={ButtonVariant.primary} onClick={() => history.push(modelDetailPath)}>
        See {modelName} details
      </Button>
      <EmptyStateSecondaryActions>
        <Button variant={ButtonVariant.link} onClick={() => history.push(modelListPath)}>
          Go to list
        </Button>
      </EmptyStateSecondaryActions>
    </EmptyState>
  );
};

type SuccessResultsProps = {
  isCreateTemplate: boolean;
  name: string;
  namespace: string;
  className?: string;
};

const stateToProps = (state, { wizardReduxID }) => ({
  isCreateTemplate: iGetCommonData(state, wizardReduxID, VMWizardProps.isCreateTemplate),
  name: iGetVmSettingValue(state, wizardReduxID, VMSettingsField.NAME),
  namespace: iGetCommonData(state, wizardReduxID, VMWizardProps.activeNamespace),
});

export const SuccessResults = connect(stateToProps)(SuccessResultsComponent);
