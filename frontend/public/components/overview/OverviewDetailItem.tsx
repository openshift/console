import type { ReactNode, FC } from 'react';
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';

export type OverviewDetailItemProps = {
  /** Details card title */
  title: string;
  children: ReactNode;
  /** Trigger skeleton loading component during the loading phase. */
  isLoading?: boolean;
  /** Optional class name for the value */
  valueClassName?: string;
  /** Error message to display */
  error?: string;
};

/**
 * A wrapper around PatternFly's description group. This component's parent must
 * be a PatternFly DescriptionList.
 */
export const OverviewDetailItem: FC<OverviewDetailItemProps> = ({
  title,
  isLoading = false,
  children,
  error,
  valueClassName,
}) => {
  let status: ReactNode;

  if (error) {
    status = <span className="pf-v6-u-text-color-subtle">{error}</span>;
  } else if (isLoading) {
    status = <div className="skeleton-text" />;
  } else {
    status = children;
  }
  return (
    <DescriptionListGroup>
      <DescriptionListTerm data-test="detail-item-title">{title}</DescriptionListTerm>
      <DescriptionListDescription className={valueClassName} data-test="detail-item-value">
        {status}
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};
