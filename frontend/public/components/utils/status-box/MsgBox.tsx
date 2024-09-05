import * as React from 'react';
import * as cx from 'classnames';
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateVariant,
} from '@patternfly/react-core';

export const MsgBox: React.FC<MsgBoxProps> = ({
  children,
  Icon,
  primaryActions,
  secondaryActions,
  title,
  ...props
}) => {
  const dataTest = props.dataTest || 'msg-box';
  const variant = props.variant || EmptyStateVariant.xs;
  const header = (title || Icon) && (
    <EmptyStateHeader
      data-test={`${dataTest}-title`}
      {...(Icon ? { icon: <EmptyStateIcon icon={Icon} /> } : {})}
      titleText={title}
    />
  );
  const bodyClassName = cx({ 'pf-v5-u-m-0': !header }); // Remove top margin if there's not a header
  const body = children && (
    <EmptyStateBody className={bodyClassName} data-test={`${dataTest}-body`}>
      {children}
    </EmptyStateBody>
  );
  const footer = (primaryActions || secondaryActions) && (
    <EmptyStateFooter data-test={`${dataTest}-footer`}>
      {primaryActions && (
        <EmptyStateActions data-test={`${dataTest}-primary-actions`}>
          {primaryActions}
        </EmptyStateActions>
      )}
      {secondaryActions && (
        <EmptyStateActions data-test={`${dataTest}-secondary-actions`}>
          {secondaryActions}
        </EmptyStateActions>
      )}
    </EmptyStateFooter>
  );
  return (
    <EmptyState variant={variant} data-test={dataTest}>
      {header}
      {body}
      {footer}
    </EmptyState>
  );
};
MsgBox.displayName = 'MsgBox';

type MsgBoxProps = {
  className?: string;
  dataTest?: string;
  Icon?: React.ComponentType;
  primaryActions?: React.ReactElement;
  secondaryActions?: React.ReactElement;
  title?: string | React.ReactElement;
  variant?: EmptyStateVariant;
};
