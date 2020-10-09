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
import { isOvirtProvider } from '../../selectors/immutable/provider/ovirt/selectors';

export const SuccessResultsComponent: React.FC<SuccessResultsProps> = ({
  isCreateTemplate,
  isOvirtImportProvider,
  isProviderImport,
  name,
  namespace,
  className,
  onClick,
}) => {
  const modelName = getVMLikeModelName(isCreateTemplate);
  const modelDetailPath = `${getVMLikeModelDetailPath(isCreateTemplate, namespace, name)}`;
  const modelListPath = `${getVMLikeModelListPath(
    isCreateTemplate,
    namespace,
  )}?orderBy=desc&sortBy=Created`;

  const detailsButton = (
    <Button
      key="detail"
      variant={ButtonVariant.primary}
      onClick={() => {
        history.push(modelDetailPath);
        onClick && onClick();
      }}
    >
      See {modelName} details
    </Button>
  );

  const listButton = (
    <Button
      key="list"
      variant={ButtonVariant.link}
      onClick={() => {
        history.push(modelListPath);
        onClick && onClick();
      }}
    >
      Go to list
    </Button>
  );
  return (
    <EmptyState variant={EmptyStateVariant.full} className={className}>
      <EmptyStateIcon icon={CheckIcon} color="#92d400" />
      <Title headingLevel="h5" size="lg" data-test-id="kubevirt-wizard-success-result">
        {isProviderImport ? `Started import of ${modelName}` : `Successfully created ${modelName}.`}
      </Title>
      {!isOvirtImportProvider && (
        <EmptyStateBody key="info">
          You can either go to the details of this {modelName} or see it in the list of available{' '}
          {modelName}s.
        </EmptyStateBody>
      )}
      {isOvirtImportProvider ? listButton : detailsButton}
      {!isOvirtImportProvider && (
        <EmptyStateSecondaryActions key="secondary">{listButton}</EmptyStateSecondaryActions>
      )}
    </EmptyState>
  );
};

type SuccessResultsProps = {
  isCreateTemplate?: boolean;
  isOvirtImportProvider?: boolean;
  isProviderImport?: boolean;
  name: string;
  namespace: string;
  className?: string;
  onClick?: VoidFunction;
};

const stateToProps = (state, { wizardReduxID }) => ({
  isCreateTemplate: iGetCommonData(state, wizardReduxID, VMWizardProps.isCreateTemplate),
  isOvirtImportProvider: isOvirtProvider(state, wizardReduxID),
  isProviderImport: iGetCommonData(state, wizardReduxID, VMWizardProps.isProviderImport),
  name: iGetVmSettingValue(state, wizardReduxID, VMSettingsField.NAME),
  namespace: iGetCommonData(state, wizardReduxID, VMWizardProps.activeNamespace),
});

export const SuccessResults = connect(stateToProps)(SuccessResultsComponent);
