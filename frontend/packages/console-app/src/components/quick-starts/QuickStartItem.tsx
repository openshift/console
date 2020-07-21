import * as React from 'react';
import { CatalogTile } from '@patternfly/react-catalog-view-extension';
import { QuickStartCatalogItem } from './utils/quick-start-typings';
import QuickStartHeader from './QuickStartHeader';
import QuickStartDescription from './QuickStartDescription';
import QuickStartFooter from './QuickStartFooter';
import './QuickStartItem.scss';

type QuickStartItemProps = {
  onClick: () => void;
} & QuickStartCatalogItem;

const QuickStartItem: React.FC<QuickStartItemProps> = ({
  iconURL,
  altIcon,
  name,
  description,
  status,
  active,
  duration,
  prerequisites,
  unmetPrerequisite,
  onClick,
}) => (
  <CatalogTile
    iconImg={iconURL}
    iconAlt={altIcon}
    className="oc-quick-start-item"
    featured={active}
    title={<QuickStartHeader name={name} status={status} duration={duration} />}
    onClick={onClick}
    description={
      <QuickStartDescription
        description={description}
        prerequisites={prerequisites}
        unmetPrerequisite={unmetPrerequisite}
      />
    }
    footer={<QuickStartFooter unmetPrerequisite={unmetPrerequisite} status={status} />}
  />
);

export default QuickStartItem;
