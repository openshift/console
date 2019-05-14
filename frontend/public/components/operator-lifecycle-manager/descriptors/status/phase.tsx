import * as React from 'react';

export const Phase: React.SFC<PhaseProps> = ({status}) => <span className={status === 'Failed' ? 'co-error' : ''}>
  { status === 'Failed' && <i className="fa fa-ban" /> } {status}
</span>;

export type PhaseProps = {
  status: string;
};

Phase.displayName = 'Phase';
