import * as React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  const PrimaryButtonText = {
    START: t('quickstart~Start Tour'),
    NEXT: t('quickstart~Next'),
    CLOSE: t('quickstart~Close'),
  };

  const getPrimaryButtonText = React.useCallback((): string => {
    if (taskNumber === totalTasks) return PrimaryButtonText.CLOSE;

    if (taskNumber > -1 && taskNumber < totalTasks) return PrimaryButtonText.NEXT;

    return PrimaryButtonText.START;
  }, [
    PrimaryButtonText.CLOSE,
    PrimaryButtonText.NEXT,
    PrimaryButtonText.START,
    taskNumber,
    totalTasks,
  ]);

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
          {t('quickstart~Back')}
        </Button>
      )}
      {status === QuickStartStatus.COMPLETE && currentPath !== quickStartPath && (
        <Link style={{ display: 'inline-block' }} to={quickStartPath}>
          {t('quickstart~View all tours')}
        </Link>
      )}
    </div>
  );
};

export default QuickStartFooter;
