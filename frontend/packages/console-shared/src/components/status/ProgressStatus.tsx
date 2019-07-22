import * as React from 'react';
import { InProgressIcon } from '@patternfly/react-icons';
import StatusIconAndText from './StatusIconAndText';

type ProgressStatusProps = {
  title?: string;
  iconOnly?: boolean;
};

const ProgressStatus: React.FC<ProgressStatusProps> = ({ title, iconOnly }) => (
  <StatusIconAndText icon={<InProgressIcon />} title={title} iconOnly={iconOnly} />
);

export default ProgressStatus;
