import type { FC } from 'react';
import { BanIcon } from '@patternfly/react-icons/dist/esm/icons/ban-icon';

export const Phase: FC<PhaseProps> = ({ status }) => (
  <span className={status === 'Failed' ? 'co-error' : ''}>
    {status === 'Failed' && <BanIcon data-test-id="ban-icon" />} {status}
  </span>
);

export type PhaseProps = {
  status: string;
};

Phase.displayName = 'Phase';
