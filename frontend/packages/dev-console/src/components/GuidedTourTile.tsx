import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardActions,
  CardBody,
  CardFooter,
  CardHeader,
  CardHeaderMain,
  Dropdown,
  DropdownItem,
  GalleryItem,
  KebabToggle,
  Title,
} from '@patternfly/react-core';
import { ArrowRightIcon } from '@patternfly/react-icons';
import { getGuidedToursWithStatus } from '@console/app/src/components/guided-tours/utils/guided-tour-utils';
import './GuidedTourTile.scss';

export const HIDE_TOUR_TILE_STORAGE_KEY = 'bridge/hide-tour-tile';

const GuidedTourTile: React.FC = () => {
  const isTourTileHidden = localStorage.getItem(HIDE_TOUR_TILE_STORAGE_KEY) === 'true';
  const [showTile, setShowTile] = React.useState<boolean>(!isTourTileHidden);
  const [isOpen, setOpen] = React.useState<boolean>(false);
  const tours = getGuidedToursWithStatus();

  const onRemove = () => {
    localStorage.setItem(HIDE_TOUR_TILE_STORAGE_KEY, 'true');
    setShowTile(false);
  };

  const onToggle = () => setOpen(!isOpen);

  const actionDropdownItem = [
    <DropdownItem
      onClick={() => {
        onRemove();
      }}
      key="action"
      component="button"
    >
      Remove guided tours
    </DropdownItem>,
  ];
  const slicedTours = tours.length > 3 ? tours.slice(0, 3) : tours;

  return slicedTours.length > 0 && showTile ? (
    <GalleryItem>
      <Card className="odc-guidedtour-tile__card">
        <CardHeader>
          <CardHeaderMain>
            <Title headingLevel="h1" size="xl">
              Guided Tours
            </Title>
          </CardHeaderMain>
          <CardActions>
            <Dropdown
              toggle={<KebabToggle onToggle={onToggle} />}
              isOpen={isOpen}
              isPlain
              dropdownItems={actionDropdownItem}
              position="right"
            />
          </CardActions>
        </CardHeader>
        <CardBody>
          {slicedTours.map((tour) => (
            <div key={tour.name} className="odc-guidedtour-tile__tour">
              <Link to="/#">{tour.name}</Link>
            </div>
          ))}
        </CardBody>
        <CardFooter className="odc-guidedtour-tile__footer">
          <ArrowRightIcon className="odc-guidedtour-tile__arrowbtn" />
          <Link to="/tours">See all guided tours</Link>
        </CardFooter>
      </Card>
    </GalleryItem>
  ) : null;
};

export default GuidedTourTile;
