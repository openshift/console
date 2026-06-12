import type { ReactNode } from 'react';
import { memo, Children } from 'react';
import { Button, Popover, PopoverProps } from '@patternfly/react-core';
import { RhUiQuestionMarkCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

export const FieldLevelHelp = memo<FieldLevelHelpProps>(
  ({ children, popoverHasAutoWidth, testId }) => {
    const { t } = useTranslation('public');
    if (Children.count(children) === 0) {
      return null;
    }
    return (
      <Popover aria-label={t('Help')} bodyContent={children} hasAutoWidth={popoverHasAutoWidth}>
        <Button
          icon={<RhUiQuestionMarkCircleIcon className="co-field-level-help__icon" />}
          aria-label={t('Help')}
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
