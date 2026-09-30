import type { FC, ReactElement } from 'react';
import type { EmptyStateProps } from '@patternfly/react-core';
import {
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateVariant,
  EmptyState,
} from '@patternfly/react-core';

export const ConsoleEmptyState: FC<ConsoleEmptyStateProps> = ({
  children,
  Icon,
  primaryActions,
  secondaryActions,
  title,
  ...props
}) => {
  const dataTest = props['data-test'] || 'console-empty-state';
  const variant = props.variant || EmptyStateVariant.sm;
  const body = children && (
    <EmptyStateBody data-test={`${dataTest}-body`}>{children}</EmptyStateBody>
  );
  const footer = (primaryActions || secondaryActions) && (
    <EmptyStateFooter data-test={`${dataTest}-footer`}>
      {primaryActions?.length > 0 && (
        <EmptyStateActions data-test={`${dataTest}-primary-actions`}>
          {primaryActions}
        </EmptyStateActions>
      )}
      {secondaryActions?.length > 0 && (
        <EmptyStateActions data-test={`${dataTest}-secondary-actions`}>
          {secondaryActions}
        </EmptyStateActions>
      )}
    </EmptyStateFooter>
  );
  return (
    <EmptyState
      className="pf-v6-u-pt-xl-on-md"
      variant={variant}
      data-test={dataTest}
      titleText={title}
      icon={Icon}
      {...props}
    >
      {body}
      {footer}
    </EmptyState>
  );
};
ConsoleEmptyState.displayName = 'ConsoleEmptyState';

type ConsoleEmptyStateProps = Partial<EmptyStateProps> & {
  variant?: EmptyStateProps['variant'];
  'data-test'?: string;
  Icon?: EmptyStateProps['icon'];
  primaryActions?: ReactElement[];
  secondaryActions?: ReactElement[];
  title?: EmptyStateProps['title'];
};
