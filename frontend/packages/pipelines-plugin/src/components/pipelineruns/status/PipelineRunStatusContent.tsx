import * as React from 'react';
import { Button, Popover, PopoverPosition } from '@patternfly/react-core';
import { DASH } from '@console/shared';
import { ComputedStatus, PipelineRunKind } from '../../../types';
import PipelineResourceStatus from './PipelineResourceStatus';
import PipelineRunStatusPopoverContent from './PipelineRunStatusPopoverContent';
import './PipelineRunStatusContent.scss';

type PipelineRunStatusProps = {
  status: string;
  pipelineRun: PipelineRunKind;
  title?: string;
};
const PipelineRunStatusContent: React.FC<PipelineRunStatusProps> = ({
  status,
  pipelineRun,
  title,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  const PopoverContent = () => {
    return <>{isPopoverOpen && <PipelineRunStatusPopoverContent pipelineRun={pipelineRun} />}</>;
  };
  return (
    <>
      {pipelineRun ? (
        status === ComputedStatus.Failed ? (
          <Popover
            bodyContent={PopoverContent}
            isVisible={isPopoverOpen}
            shouldClose={() => setIsPopoverOpen(false)}
            shouldOpen={() => setIsPopoverOpen(true)}
            position={PopoverPosition.auto}
          >
            <Button
              icon={<PipelineResourceStatus status={status} title={title} />}
              variant="plain"
              className="odc-status-column-text"
            />
          </Popover>
        ) : (
          <PipelineResourceStatus status={status} title={title} />
        )
      ) : (
        <>{DASH}</>
      )}
    </>
  );
};

export default PipelineRunStatusContent;
