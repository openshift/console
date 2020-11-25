import * as React from 'react';
import { Alert, AlertActionCloseButton, AlertProps } from '@patternfly/react-core';

import './PipelineOverviewAlert.scss';

type PipelineOverviewAlertProps = {
  title: string;
  onClose?: () => void;
};

const PipelineOverviewAlert: React.FC<PipelineOverviewAlertProps & AlertProps> = ({
  title,
  onClose,
}) => {
  return (
    <Alert
      className="pipeline-overview-alert"
      variant="default"
      isInline
      title={title}
      actionClose={<AlertActionCloseButton onClose={onClose} />}
    />
  );
};

export default PipelineOverviewAlert;
