import * as React from 'react';
import { InProgressIcon } from '@patternfly/react-icons';
import StatusIconAndText from './StatusIconAndText';

type ProgressStatusProps = {
  title?: string;
  iconOnly?: boolean;
  noTooltip?: boolean;
};

const ProgressStatus: React.FC<ProgressStatusProps> = (props) => (
  <StatusIconAndText {...props} icon={<InProgressIcon />} />
);

export default ProgressStatus;
