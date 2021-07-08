import * as React from 'react';
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
import { CheckIcon } from '@patternfly/react-icons';
import { global_palette_light_green_400 as globalLightGreen400 } from '@patternfly/react-tokens/dist/js/global_palette_light_green_400';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { history } from '@console/internal/components/utils';
import { getVMLikeModelDetailPath, getVMLikeModelListPath } from '../../../../utils/utils';
import { isOvirtProvider } from '../../selectors/immutable/provider/ovirt/selectors';
import { iGetCommonData } from '../../selectors/immutable/selectors';
import { iGetVmSettingValue } from '../../selectors/immutable/vm-settings';
import { VMSettingsField, VMWizardProps } from '../../types';

export const SuccessResultsComponent: React.FC<SuccessResultsProps> = ({
  isCreateTemplate,
  isOvirtImportProvider,
  isProviderImport,
  name,
  namespace,
  className,
  onClick,
}) => {
  const { t } = useTranslation();
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
      {isCreateTemplate
        ? t('kubevirt-plugin~See virtual machine template details')
        : t('kubevirt-plugin~See virtual machine details')}
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
      data-test="success-list"
    >
      {t('kubevirt-plugin~Go to list')}
    </Button>
  );

  let title: string;
  if (isProviderImport) {
    title = t('kubevirt-plugin~Started import of virtual machine');
  } else if (isCreateTemplate) {
    title = t('kubevirt-plugin~Successfully created virtual machine template');
  } else {
    title = t('kubevirt-plugin~Successfully created virtual machine');
  }

  let description: string;
  if (isCreateTemplate) {
    description = t(
      'kubevirt-plugin~You can either go to the details of this virtual machine template or see it in the list of available virtual machine templates.',
    );
  } else {
    description = t(
      'kubevirt-plugin~You can either go to the details of this virtual machine or see it in the list of available virtual machines.',
    );
  }
  return (
    <EmptyState variant={EmptyStateVariant.full} className={className}>
      <EmptyStateIcon icon={CheckIcon} color={globalLightGreen400.value} />
      <Title headingLevel="h5" size="lg" data-test-id="kubevirt-wizard-success-result">
        {title}
      </Title>
      {!isOvirtImportProvider && <EmptyStateBody key="info">{description}</EmptyStateBody>}
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
