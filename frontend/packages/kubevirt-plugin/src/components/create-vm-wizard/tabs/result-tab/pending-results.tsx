import * as React from 'react';
import { connect } from 'react-redux';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/EmptyState/empty-state';
import { EmptyState, EmptyStateBody, EmptyStateVariant, Title } from '@patternfly/react-core';
import { LoadingInline } from '@console/internal/components/utils';
import { iGetCommonData } from '../../selectors/immutable/selectors';
import { VMWizardProps } from '../../types';
import { getVMLikeModelName } from '../../../../utils/utils';

const PendingResultsComponent: React.FC<PendingResultsProps> = ({ isCreateTemplate }) => (
  <EmptyState variant={EmptyStateVariant.full}>
    <div className={css(styles.emptyStateIcon)}>
      <LoadingInline />
    </div>
    <Title headingLevel="h5" size="lg">
      {`Creating ${getVMLikeModelName(isCreateTemplate)}.`}
    </Title>
    <EmptyStateBody>This shouldn&apos;t take very long.</EmptyStateBody>
  </EmptyState>
);

type PendingResultsProps = {
  isCreateTemplate: boolean;
};

const stateToProps = (state, { wizardReduxID }) => ({
  isCreateTemplate: iGetCommonData(state, wizardReduxID, VMWizardProps.isCreateTemplate),
});

export const PendingResults = connect(stateToProps)(PendingResultsComponent);
