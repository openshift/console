import type { FC, ReactNode } from 'react';
import { memo, Children } from 'react';
import { Button, Popover, PopoverProps } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon';
import { useTranslation } from 'react-i18next';

export const FieldLevelHelp: FC<FieldLevelHelpProps> = memo(
  ({ children, popoverHasAutoWidth, testId }) => {
    const { t } = useTranslation();
    if (Children.count(children) === 0) {
      return null;
    }
    return (
      <Popover
        aria-label={t('public~Help')}
        bodyContent={children}
        hasAutoWidth={popoverHasAutoWidth}
      >
        <Button
          icon={<OutlinedQuestionCircleIcon className="co-field-level-help__icon" />}
          aria-label={t('public~Help')}
          variant="link"
          isInline
          className="co-field-level-help"
          data-test-id={testId || null}
        />
      </Popover>
    );
  },
);

type FieldLevelHelpProps = {
  children: ReactNode;
  popoverHasAutoWidth?: PopoverProps['hasAutoWidth'];
  testId?: string;
};
