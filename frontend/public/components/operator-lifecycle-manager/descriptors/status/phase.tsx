import * as React from 'react';
import { BanIcon } from '@patternfly/react-icons';

export const Phase: React.SFC<PhaseProps> = ({status}) => <span className={status === 'Failed' ? 'co-error' : ''}>
  { status === 'Failed' && <BanIcon data-test-id="ban-icon" /> } {status}
</span>;

export type PhaseProps = {
  status: string;
};

Phase.displayName = 'Phase';
