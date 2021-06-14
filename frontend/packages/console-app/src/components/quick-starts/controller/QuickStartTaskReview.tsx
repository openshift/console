import * as React from 'react';
import { Alert, Radio } from '@patternfly/react-core';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import QuickStartMarkdownView from '../QuickStartMarkdownView';
import { QuickStartTaskStatus, QuickStartTaskReview } from '../utils/quick-start-types';

import './QuickStartTaskReview.scss';

type QuickStartTaskReviewProps = {
  review: QuickStartTaskReview;
  taskStatus: QuickStartTaskStatus;
  onTaskReview: (status: QuickStartTaskStatus) => void;
};

const getAlertVariant = (status) => {
  switch (status) {
    case QuickStartTaskStatus.SUCCESS:
      return 'success';
    case QuickStartTaskStatus.FAILED:
      return 'danger';
    default:
      return 'info';
  }
};

const QuickStartTaskReview: React.FC<QuickStartTaskReviewProps> = ({
  review,
  taskStatus,
  onTaskReview,
}) => {
  const { instructions, failedTaskHelp: taskHelp } = review;
  const { t } = useTranslation();

  const alertClassNames = cx('co-quick-start-task-review', {
    'co-quick-start-task-review--success': taskStatus === QuickStartTaskStatus.SUCCESS,
    'co-quick-start-task-review--failed': taskStatus === QuickStartTaskStatus.FAILED,
  });

  const title = <span className={alertClassNames}>{t('quickstart~Check your work')}</span>;

  return (
    <Alert variant={getAlertVariant(taskStatus)} title={title} isInline>
      <QuickStartMarkdownView content={instructions} />
      <span className="co-quick-start-task-review__actions">
        <Radio
          id="review-success"
          name="review-success"
          label={t('quickstart~Yes')}
          className="co-quick-start-task-review__radio"
          isChecked={taskStatus === QuickStartTaskStatus.SUCCESS}
          onChange={() => onTaskReview(QuickStartTaskStatus.SUCCESS)}
        />
        <Radio
          id="review-failed"
          name="review-failed"
          label={t('quickstart~No')}
          className="co-quick-start-task-review__radio"
          isChecked={taskStatus === QuickStartTaskStatus.FAILED}
          onChange={() => onTaskReview(QuickStartTaskStatus.FAILED)}
        />
      </span>
      {taskStatus === QuickStartTaskStatus.FAILED && taskHelp && (
        <QuickStartMarkdownView content={taskHelp} exactHeight />
      )}
    </Alert>
  );
};

export default QuickStartTaskReview;
