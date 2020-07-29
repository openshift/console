import * as React from 'react';
import { QuickStartStatus } from '../utils/quick-start-types';
import { Button } from '@patternfly/react-core';
import { Link } from 'react-router-dom';

import './QuickStartFooter.scss';

type QuickStartFooterProps = {
  status: QuickStartStatus;
  onNext: () => void;
  onBack: () => void;
};

enum PrimaryButtonText {
  START = 'Start Tour',
  NEXT = 'Next',
  CLOSE = 'Close',
}

const getPrimaryButtonText = (status: string): PrimaryButtonText => {
  switch (status) {
    case QuickStartStatus.COMPLETE:
      return PrimaryButtonText.CLOSE;
    case QuickStartStatus.IN_PROGRESS:
      return PrimaryButtonText.NEXT;
    default:
      return PrimaryButtonText.START;
  }
};

const QuickStartFooter: React.FC<QuickStartFooterProps> = ({ status, onNext, onBack }) => (
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
      {getPrimaryButtonText(status)}
    </Button>
    {status !== QuickStartStatus.NOT_STARTED && (
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
    {status === QuickStartStatus.COMPLETE && (
      <Link style={{ display: 'inline-block' }} to="/quickstart">
        View all tours
      </Link>
    )}
  </div>
);

export default QuickStartFooter;
