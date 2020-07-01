import * as React from 'react';
import { Status } from '@console/shared';
import { Badge } from '@patternfly/react-core';
import { OutlinedClockIcon } from '@patternfly/react-icons';
import { GuidedTourStatus } from './utils/guided-tour-status';
import './TourItemHeader.scss';

type TourItemHeaderProps = {
  status: string;
  duration: number;
  name: string;
};
const TourItemHeader: React.FC<TourItemHeaderProps> = ({ status, duration, name }) => (
  <div className="oc-tour-item-header">
    {name}
    <div className="oc-tour-item-header__status">
      {/* fix me - change badges to labels once migrated to PF4 - */}
      {status !== GuidedTourStatus.NOT_STARTED && (
        <Badge isRead>
          <Status status={status} />
        </Badge>
      )}
      <Badge isRead>
        <OutlinedClockIcon className="oc-tour-item-header--rightmargin" />
        <span className="oc-tour-item-header--rightmargin">{duration}</span>minutes
      </Badge>
    </div>
  </div>
);

// there could be various statuses in future
export default TourItemHeader;
