import * as React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@patternfly/react-core';
import { QuickStartStatus } from '../utils/quick-start-types';

import './QuickStartFooter.scss';

type QuickStartFooterProps = {
  status: QuickStartStatus;
  taskNumber: number;
  totalTasks: number;
  onNext: () => void;
  onBack: () => void;
};

enum PrimaryButtonText {
  START = 'Start Tour',
  NEXT = 'Next',
  CLOSE = 'Close',
}

const QuickStartFooter: React.FC<QuickStartFooterProps> = ({
  status,
  taskNumber,
  totalTasks,
  onNext,
  onBack,
}) => {
  const location = useLocation();
  const { pathname: currentPath } = location;
  const quickStartPath = '/quickstart';

  const getPrimaryButtonText = React.useCallback((): PrimaryButtonText => {
    if (taskNumber === totalTasks) return PrimaryButtonText.CLOSE;

    if (taskNumber > -1 && taskNumber < totalTasks) return PrimaryButtonText.NEXT;

    return PrimaryButtonText.START;
  }, [taskNumber, totalTasks]);

  return (
    <div className="co-quick-start-footer">
      <Button
        style={{
          marginRight: 'var(--pf-global--spacer--md)',
        }}
        type="submit"
        variant="primary"
        onClick={onNext}
        isInline
      >
        {getPrimaryButtonText()}
      </Button>
      {taskNumber > -1 && (
        <Button
          style={{
            marginRight: 'var(--pf-global--spacer--md)',
          }}
          type="submit"
          variant="secondary"
          onClick={onBack}
          isInline
        >
          Back
        </Button>
      )}
      {status === QuickStartStatus.COMPLETE && currentPath !== quickStartPath && (
        <Link style={{ display: 'inline-block' }} to={quickStartPath}>
          View all tours
        </Link>
      )}
    </div>
  );
};

export default QuickStartFooter;
