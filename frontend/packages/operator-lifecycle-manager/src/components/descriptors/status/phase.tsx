import type { FC } from 'react';
import { RhUiBanIcon } from '@patternfly/react-icons';

export const Phase: FC<PhaseProps> = ({ status }) => (
  <span className={status === 'Failed' ? 'co-error' : ''}>
    {status === 'Failed' && <RhUiBanIcon data-test-id="ban-icon" />} {status}
  </span>
);

export type PhaseProps = {
  status: string;
};

Phase.displayName = 'Phase';
