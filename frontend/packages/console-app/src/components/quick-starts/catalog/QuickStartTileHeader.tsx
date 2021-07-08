import * as React from 'react';
import { Label, Title } from '@patternfly/react-core';
import { OutlinedClockIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { StatusIcon } from '@console/shared';
import { QuickStartStatus } from '../utils/quick-start-types';
import './QuickStartTileHeader.scss';

type QuickStartTileHeaderProps = {
  status: string;
  duration: number;
  name: string;
};

const statusColorMap = {
  [QuickStartStatus.COMPLETE]: 'green',
  [QuickStartStatus.IN_PROGRESS]: 'purple',
  [QuickStartStatus.NOT_STARTED]: 'grey',
};

const QuickStartTileHeader: React.FC<QuickStartTileHeaderProps> = ({ status, duration, name }) => {
  const { t } = useTranslation();

  const statusLocaleMap = {
    [QuickStartStatus.COMPLETE]: t('console-app~Complete'),
    [QuickStartStatus.IN_PROGRESS]: t('console-app~In progress'),
    [QuickStartStatus.NOT_STARTED]: t('console-app~Not started'),
  };

  return (
    <div className="co-quick-start-tile-header">
      <Title headingLevel="h3" data-test="title">
        {name}
      </Title>
      <div className="co-quick-start-tile-header__status">
        {status !== QuickStartStatus.NOT_STARTED && (
          <Label
            className="co-quick-start-tile-header--margin"
            variant="outline"
            color={statusColorMap[status]}
            icon={<StatusIcon status={status} />}
            data-test="status"
          >
            {statusLocaleMap[status]}
          </Label>
        )}
        <Label variant="outline" icon={<OutlinedClockIcon />}>
          {t('console-app~{{duration, number}} minutes', { duration })}
        </Label>
      </div>
    </div>
  );
};

export default QuickStartTileHeader;
