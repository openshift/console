import * as React from 'react';
import * as classNames from 'classnames';
import { ExpandableSection } from '@patternfly/react-core';

import './result-tab-row.scss';

export const ResultTabRow: React.FC<ResultTabRowProps> = ({
  title,
  content,
  isError,
  alignMiddle,
}) => {
  if (!title && !content) {
    return null;
  }

  return (
    <ExpandableSection
      toggleText={title || ''}
      className={classNames({
        'kubevirt-create-vm-modal___result-tab-row-container': alignMiddle,
        'kubevirt-create-vm-modal___result-tab-row-container--error': isError,
      })}
    >
      <pre className="kubevirt-create-vm-modal__result-tab-row">{content}</pre>
    </ExpandableSection>
  );
};

type ResultTabRowProps = {
  title: string;
  content: string;
  isError: boolean;
  alignMiddle?: boolean;
};
