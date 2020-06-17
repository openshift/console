import * as React from 'react';
import { CatalogTile } from '@patternfly/react-catalog-view-extension';
import { GuidedTourItem, TourStatus } from './utils/guided-tour-typings';
import TourItemHeader from './TourItemHeader';
import TourItemDescription from './TourItemDescription';
import TourItemFooter from './TourItemFooter';
import './GuidedTourItem.scss';

type GuidedTourItemProps = GuidedTourItem & TourStatus;

const GuidedTourItem: React.FC<GuidedTourItemProps> = ({
  iconURL,
  altIcon,
  name,
  description,
  status,
  active,
  duration,
  prerequisites,
}) => (
  <CatalogTile
    className="odc-guided-tour-item"
    featured={active}
    title={
      <TourItemHeader
        iconURL={iconURL}
        altIcon={altIcon}
        name={name}
        status={status}
        duration={duration}
      />
    }
    description={<TourItemDescription description={description} prerequisites={prerequisites} />}
    footer={<TourItemFooter status={status} />}
  />
);

export default GuidedTourItem;
