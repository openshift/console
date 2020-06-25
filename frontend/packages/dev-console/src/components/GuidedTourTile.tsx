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
} from '@patternfly/react-core';
import { ArrowRightIcon } from '@patternfly/react-icons';
import {
  GuidedTourItem,
  TourStatus,
} from '@console/app/src/components/guided-tours/utils/guided-tour-typings';
import './GuidedTourTile.scss';

type TourItem = GuidedTourItem & TourStatus;
type GuidedTourTileProps = {
  tours: TourItem[];
};

const GuidedTourTile: React.FC<GuidedTourTileProps> = ({ tours }) => {
  const [isOpen, setOpen] = React.useState(false);
  const onToggle = () => setOpen(!isOpen);
  const actionDropdownItem = [<DropdownItem key="link">Remove guided tours</DropdownItem>];
  const orderedTours = tours.length > 3 ? tours.slice(0, 3) : tours;
  return (
    <GalleryItem className="odc-guidedtour-tile">
      <Card className="odc-guidedtour-tile__card">
        <CardHeader>
          <CardHeaderMain className="odc-guidedtour-tile__title">Guided Tours</CardHeaderMain>
          <CardActions>
            <Dropdown
              toggle={<KebabToggle onToggle={onToggle} />}
              isOpen={isOpen}
              isPlain
              dropdownItems={actionDropdownItem}
              position={'right'}
            />
          </CardActions>
        </CardHeader>
        <CardBody className="odc-guidedtour-tile__body">
          {orderedTours.map((tour) => (
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
  );
};

export default GuidedTourTile;
