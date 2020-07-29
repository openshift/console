import * as React from 'react';
import cx from 'classnames';
import { QuickStartTaskStatus } from '../utils/quick-start-types';
import { Alert, Radio } from '@patternfly/react-core';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';

type QuickStartTaskReviewProps = {
  review: string;
  taskStatus: QuickStartTaskStatus;
  taskHelp: string;
  onTaskReview: (status: QuickStartTaskStatus) => void;
};

const QuickStartTaskReview: React.FC<QuickStartTaskReviewProps> = ({
  review,
  taskStatus,
  taskHelp,
  onTaskReview,
}) => (
  <Alert
    isInline
    variant={
      taskStatus === QuickStartTaskStatus.SUCCESS
        ? 'success'
        : taskStatus === QuickStartTaskStatus.FAILED
        ? 'danger'
        : 'info'
    }
    title={
      <span
        className={cx({
          'co-quick-start-task__review-success': taskStatus === QuickStartTaskStatus.SUCCESS,
          'co-quick-start-task__review-failed': taskStatus === QuickStartTaskStatus.FAILED,
        })}
      >
        Check your work
      </span>
    }
  >
    <SyncMarkdownView content={review} />
    <span className="co-quick-start-task__radio-button-group">
      <Radio
        name="review-affirmative"
        onChange={() => onTaskReview(QuickStartTaskStatus.SUCCESS)}
        label="Yes"
        id="review-affirmative"
        isChecked={taskStatus === QuickStartTaskStatus.SUCCESS}
        className="co-quick-start-task__radio-button-field"
      />
      <Radio
        name="review-negative"
        onChange={() => onTaskReview(QuickStartTaskStatus.FAILED)}
        label="No"
        id="review-negative"
        isChecked={taskStatus === QuickStartTaskStatus.FAILED}
        className="co-quick-start-task__radio-button-field"
      />
    </span>
    {taskStatus === QuickStartTaskStatus.FAILED && taskHelp && <h5>{taskHelp}</h5>}
  </Alert>
);

export default QuickStartTaskReview;
