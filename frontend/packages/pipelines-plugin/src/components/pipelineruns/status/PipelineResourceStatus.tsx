import * as React from 'react';
import { Status } from '@console/shared';

type PipelineResourceStatusProps = {
  status: string;
  children?: React.ReactNode;
};
const PipelineResourceStatus: React.FC<PipelineResourceStatusProps> = ({ status, children }) => (
  <Status status={status}>
    {status === 'Failed' && React.Children.toArray(children).length > 0 && children}
  </Status>
);

export default PipelineResourceStatus;
