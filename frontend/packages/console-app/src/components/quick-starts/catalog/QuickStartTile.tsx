import * as React from 'react';
import { CatalogTile } from '@patternfly/react-catalog-view-extension';
import { QuickStartStatus, QuickStart } from '../utils/quick-start-types';
import QuickStartTileHeader from './QuickStartTileHeader';
import QuickStartTileDescription from './QuickStartTileDescription';
import QuickStartTileFooter from './QuickStartTileFooter';

import './QuickStartTile.scss';

type QuickStartTileProps = {
  quickStart: QuickStart;
  status: QuickStartStatus;
  isActive: boolean;
  onClick: () => void;
};

const QuickStartTile: React.FC<QuickStartTileProps> = ({
  quickStart,
  status,
  isActive,
  onClick,
}) => {
  const { id, iconURL, altIcon, name, description, duration, prerequisites } = quickStart;
  return (
    <CatalogTile
      iconImg={iconURL}
      iconAlt={altIcon}
      className="co-quick-start-tile"
      featured={isActive}
      title={<QuickStartTileHeader name={name} status={status} duration={duration} />}
      onClick={onClick}
      description={
        <QuickStartTileDescription description={description} prerequisites={prerequisites} />
      }
      footer={<QuickStartTileFooter quickStartId={id} status={status} />}
    />
  );
};

export default QuickStartTile;
