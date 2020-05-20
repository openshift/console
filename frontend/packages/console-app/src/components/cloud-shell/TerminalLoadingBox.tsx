import * as React from 'react';
import { LoadingBox } from '@console/internal/components/utils/status-box';

const TerminalLoadingBox: React.FC = () => (
  <LoadingBox message="Connecting to your OpenShift command line terminal ..." />
);

export default TerminalLoadingBox;
