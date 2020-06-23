import * as React from 'react';
import { CatalogTile } from '@patternfly/react-catalog-view-extension';
import { GuidedTourItem, GuidedTourCatalogItem } from './utils/guided-tour-typings';
import TourItemHeader from './TourItemHeader';
import TourItemDescription from './TourItemDescription';
import TourItemFooter from './TourItemFooter';
import './GuidedTourItem.scss';

type GuidedTourItemProps = GuidedTourCatalogItem;

const GuidedTourItem: React.FC<GuidedTourItemProps> = ({
  iconURL,
  altIcon,
  name,
  description,
  status,
  active,
  duration,
  prerequisites,
  unmetPrerequisite,
}) => (
  <CatalogTile
    iconImg={iconURL}
    iconAlt={altIcon}
    className="oc-guided-tour-item"
    featured={active}
    title={<TourItemHeader name={name} status={status} duration={duration} />}
    description={
      <TourItemDescription
        description={description}
        prerequisites={prerequisites}
        unmetPrerequisite={unmetPrerequisite}
      />
    }
    footer={<TourItemFooter unmetPrerequisite={unmetPrerequisite} status={status} />}
  />
);

export default GuidedTourItem;
