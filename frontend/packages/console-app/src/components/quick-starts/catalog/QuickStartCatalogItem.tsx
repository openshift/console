import * as React from 'react';
import { CatalogTile } from '@patternfly/react-catalog-view-extension';
import { QuickStartStatus, QuickStart } from '../utils/quick-start-types';
import QuickStartHeader from './QuickStartHeader';
import QuickStartDescription from './QuickStartDescription';
import QuickStartFooter from './QuickStartFooter';

import './QuickStartCatalogItem.scss';

type QuickStartCatalogItemProps = {
  quickStart: QuickStart;
  status: QuickStartStatus;
  isActive: boolean;
  onClick: () => void;
};

const QuickStartCatalogItem: React.FC<QuickStartCatalogItemProps> = ({
  quickStart,
  status,
  isActive,
  onClick,
}) => {
  const { iconURL, altIcon, name, description, duration, prerequisites } = quickStart;
  return (
    <CatalogTile
      iconImg={iconURL}
      iconAlt={altIcon}
      className="co-quick-start-catalog-item"
      featured={isActive}
      title={<QuickStartHeader name={name} status={status} duration={duration} />}
      onClick={onClick}
      description={
        <QuickStartDescription
          description={description}
          prerequisites={prerequisites}
          unmetPrerequisite={false}
        />
      }
      footer={<QuickStartFooter unmetPrerequisite={false} status={status} />}
    />
  );
};

export default QuickStartCatalogItem;
