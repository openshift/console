import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Flex, FlexItem, Button } from '@patternfly/react-core';
import { QuickStartStatus } from '../utils/quick-start-types';
import { QuickStartContext, QuickStartContextValues } from '../utils/quick-start-context';

type QuickStartTileFooterProps = {
  quickStartId: string;
  status: string;
  totalTasks?: number;
};

const QuickStartTileFooter: React.FC<QuickStartTileFooterProps> = ({
  quickStartId,
  status,
  totalTasks,
}) => {
  const { t } = useTranslation();
  const { activeQuickStartID, startQuickStart, restartQuickStart } = React.useContext<
    QuickStartContextValues
  >(QuickStartContext);

  const start = React.useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startQuickStart(quickStartId, totalTasks);
    },
    [quickStartId, startQuickStart, totalTasks],
  );

  const restart = React.useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      e.stopPropagation();
      restartQuickStart(quickStartId, totalTasks);
    },
    [quickStartId, restartQuickStart, totalTasks],
  );

  return (
    <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
      {status === QuickStartStatus.NOT_STARTED && (
        <FlexItem>
          <Button onClick={start} variant="link" isInline>
            {t('quickstart~Start the tour')}
          </Button>
        </FlexItem>
      )}
      {status === QuickStartStatus.IN_PROGRESS && activeQuickStartID !== quickStartId && (
        <FlexItem>
          <Button variant="link" isInline>
            {t('quickstart~Resume the tour')}
          </Button>
        </FlexItem>
      )}
      {status === QuickStartStatus.COMPLETE && (
        <FlexItem>
          <Button onClick={restart} variant="link" isInline>
            {t('quickstart~Start the tour')}
          </Button>
        </FlexItem>
      )}
      {status === QuickStartStatus.IN_PROGRESS && (
        <FlexItem>
          <Button onClick={restart} variant="link" isInline>
            {t('quickstart~Restart the tour')}
          </Button>
        </FlexItem>
      )}
    </Flex>
  );
};

export default QuickStartTileFooter;
