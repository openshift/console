import * as React from 'react';
import { Status } from '@console/shared';
import { Badge } from '@patternfly/react-core';
import { GuidedTourStatus } from './utils/guided-tour-status';
import './TourItemHeader.scss';

type TourItemHeaderProps = {
  status: string;
  duration: number;
  iconURL: string;
  altIcon: string;
  name: string;
};
const TourItemHeader: React.FC<TourItemHeaderProps> = ({
  status,
  duration,
  name,
  iconURL,
  altIcon,
}) => (
  <div className="odc-tour-item-header">
    <img className="odc-tour-item-header__icon" src={iconURL} alt={altIcon} />
    {name}
    <div className="odc-tour-item-header__status">
      {status !== GuidedTourStatus.NOT_STARTED && (
        <Badge key={1} isRead>
          <Status status={status} />
        </Badge>
      )}
      <Badge key={2} isRead>{`${duration} m`}</Badge>
    </div>
  </div>
);

// there could be various statuses in future
export default TourItemHeader;
