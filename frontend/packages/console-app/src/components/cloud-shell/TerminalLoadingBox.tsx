import * as React from 'react';
import { LoadingBox } from '@console/internal/components/utils/status-box';

type TerminalLoadingBoxProps = {
  message?: string;
};

const TerminalLoadingBox: React.FC<TerminalLoadingBoxProps> = ({ message }) => (
  <LoadingBox message={message ?? 'Connecting to your OpenShift command line terminal ...'} />
);

export default TerminalLoadingBox;
