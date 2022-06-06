import * as React from 'react';
import { BuildRun } from '../../types';

type BuildRunLogsTabProps = {
  obj: BuildRun;
};

const BuildRunLogsTab: React.FC<BuildRunLogsTabProps> = ({ obj: buildRun }) => {
  return <>{buildRun.metadata.name} logs...</>;
};

export default BuildRunLogsTab;
