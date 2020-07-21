import * as React from 'react';
import { StatusIcon } from '@console/shared';
import { Label } from '@patternfly/react-core';
import { OutlinedClockIcon } from '@patternfly/react-icons';
import { QuickStartStatus } from './utils/quick-start-status';
import './QuickStartHeader.scss';

type QuickStartHeaderProps = {
  status: string;
  duration: number;
  name: string;
};
const QuickStartHeader: React.FC<QuickStartHeaderProps> = ({ status, duration, name }) => (
  <div className="oc-quick-start-header">
    {name}
    <div className="oc-quick-start-header_status">
      {status !== QuickStartStatus.NOT_STARTED && (
        <Label
          className="oc-quick-start-header--rightmargin"
          variant="outline"
          icon={<StatusIcon status={status} />}
        >
          {status}
        </Label>
      )}
      <Label variant="outline" icon={<OutlinedClockIcon />}>
        {`${duration} minutes`}
      </Label>
    </div>
  </div>
);

// there could be various statuses in future
export default QuickStartHeader;
