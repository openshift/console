import * as React from 'react';
import { createModalLauncher, ModalComponentProps } from '@console/internal/components/factory';
import { ApprovalTaskKind } from '@console/pipelines-plugin/src/types';
import Approval from './Approval';

type ApprovalControllerProps = {
  resource: ApprovalTaskKind;
  pipelineRunName?: string;
  userName?: string;
  type: string;
};

const ApprovalController: React.FC<ApprovalControllerProps> = ({
  resource,
  pipelineRunName,
  userName,
  type,
  ...props
}) => (
  <Approval
    {...props}
    resource={resource}
    pipelineRunName={pipelineRunName}
    type={type}
    userName={userName}
  />
);

type Props = ApprovalControllerProps & ModalComponentProps;

export const ApprovalModalLauncher = createModalLauncher<Props>(ApprovalController);

export default ApprovalController;
