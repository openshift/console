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
import { getQuickStarts } from '@console/app/src/components/quick-starts/utils/quick-start-utils';
import './QuickStartTile.scss';

export const HIDE_QUICK_START_STORAGE_KEY = 'bridge/hide-tour-tile';

const QuickStartTile: React.FC = () => {
  const isQuickStartTileHidden = localStorage.getItem(HIDE_QUICK_START_STORAGE_KEY) === 'true';
  const [showTile, setShowTile] = React.useState<boolean>(!isQuickStartTileHidden);
  const [isOpen, setOpen] = React.useState<boolean>(false);
  const tours = getQuickStarts();

  const onRemove = () => {
    localStorage.setItem(HIDE_QUICK_START_STORAGE_KEY, 'true');
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
      Remove quick starts
    </DropdownItem>,
  ];
  const slicedTours = tours.length > 3 ? tours.slice(0, 3) : tours;

  return slicedTours.length > 0 && showTile ? (
    <GalleryItem>
      <Card className="odc-quick-start-tile__card">
        <CardHeader>
          <CardHeaderMain>
            <Title headingLevel="h1" size="xl">
              Quick Starts
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
            <div key={tour.name} className="odc-quick-start-tile__tour">
              <Link to="/#">{tour.name}</Link>
            </div>
          ))}
        </CardBody>
        <CardFooter className="odc-quick-start-tile__footer">
          <ArrowRightIcon className="odc-quick-start-tile__arrowbtn" />
          <Link to="/quickstart">See all Quick Starts</Link>
        </CardFooter>
      </Card>
    </GalleryItem>
  ) : null;
};

export default QuickStartTile;
