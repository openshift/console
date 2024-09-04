import * as React from 'react';
import { EmptyState, EmptyStateBody, EmptyStateHeader } from '@patternfly/react-core';

export const MsgBox: React.FC<MsgBoxProps> = ({ title, children }) => (
  <EmptyState>
    {title && <EmptyStateHeader data-test="msg-box-title" titleText={title} />}
    {children && <EmptyStateBody data-test="msg-box-body">{children}</EmptyStateBody>}
  </EmptyState>
);
MsgBox.displayName = 'MsgBox';

type MsgBoxProps = {
  title?: string;
  className?: string;
};
