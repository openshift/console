import * as React from 'react';
import { CatalogTile } from '@patternfly/react-catalog-view-extension';
import { RocketIcon } from '@patternfly/react-icons';
import { FallbackImg } from '@console/shared';
import { QuickStartStatus, QuickStart } from '../utils/quick-start-types';
import QuickStartTileDescription from './QuickStartTileDescription';
import QuickStartTileHeader from './QuickStartTileHeader';

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
  const {
    metadata: { name },
    spec: { icon, displayName, description, durationMinutes, prerequisites },
  } = quickStart;

  const quickStartIcon = (
    <FallbackImg
      className="co-catalog-item-icon__img--large"
      src={icon}
      alt={displayName}
      fallback={<RocketIcon />}
      aria-hidden
    />
  );

  return (
    <CatalogTile
      icon={quickStartIcon}
      className="co-quick-start-tile"
      featured={isActive}
      title={<QuickStartTileHeader name={displayName} status={status} duration={durationMinutes} />}
      onClick={onClick}
      data-test={`tile ${name}`}
    >
      <QuickStartTileDescription description={description} prerequisites={prerequisites} />
    </CatalogTile>
  );
};

export default QuickStartTile;
