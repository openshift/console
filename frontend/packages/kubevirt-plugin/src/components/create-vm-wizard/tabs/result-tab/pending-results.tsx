import * as React from 'react';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  EmptyStateHeader,
} from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/EmptyState/empty-state';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { LoadingInline } from '@console/internal/components/utils';
import { iGetCommonData } from '../../selectors/immutable/selectors';
import { VMWizardProps } from '../../types';

const PendingResultsComponent: React.FC<PendingResultsProps> = ({ isCreateTemplate }) => {
  const { t } = useTranslation();
  return (
    <EmptyState variant={EmptyStateVariant.full}>
      <div className={css(styles.emptyStateIcon)}>
        <LoadingInline />
      </div>
      <EmptyStateHeader
        titleText={
          <>
            {isCreateTemplate
              ? t('kubevirt-plugin~Creating virtual machine template')
              : t('kubevirt-plugin~Creating virtual machine')}
          </>
        }
        headingLevel="h5"
      />
      <EmptyStateBody>{t("kubevirt-plugin~This shouldn't take very long.")}</EmptyStateBody>
    </EmptyState>
  );
};

type PendingResultsProps = {
  isCreateTemplate: boolean;
};

const stateToProps = (state, { wizardReduxID }) => ({
  isCreateTemplate: iGetCommonData(state, wizardReduxID, VMWizardProps.isCreateTemplate),
});

export const PendingResults = connect(stateToProps)(PendingResultsComponent);
