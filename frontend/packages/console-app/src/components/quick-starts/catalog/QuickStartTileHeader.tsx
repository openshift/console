import * as React from 'react';
import { StatusIcon } from '@console/shared';
import { Label, Title } from '@patternfly/react-core';
import { OutlinedClockIcon } from '@patternfly/react-icons';
import { QuickStartStatus } from '../utils/quick-start-types';
import './QuickStartTileHeader.scss';

type QuickStartTileHeaderProps = {
  status: string;
  duration: number;
  name: string;
};

const statusColorMap = {
  [QuickStartStatus.COMPLETE]: 'green',
  [QuickStartStatus.IN_PROGRESS]: 'purple',
  [QuickStartStatus.NOT_STARTED]: 'grey',
};

const QuickStartTileHeader: React.FC<QuickStartTileHeaderProps> = ({ status, duration, name }) => (
  <div className="co-quick-start-tile-header">
    <Title headingLevel="h3">{name}</Title>
    <div className="co-quick-start-tile-header__status">
      {status !== QuickStartStatus.NOT_STARTED && (
        <Label
          className="co-quick-start-tile-header--rightmargin"
          variant="outline"
          color={statusColorMap[status]}
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

export default QuickStartTileHeader;
