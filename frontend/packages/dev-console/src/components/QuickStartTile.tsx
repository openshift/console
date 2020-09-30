import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
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
  Button,
} from '@patternfly/react-core';
import { ArrowRightIcon } from '@patternfly/react-icons';
import { QuickStart } from '@console/app/src/components/quick-starts/utils/quick-start-types';
import * as QuickStartActions from '@console/app/src/redux/actions/quick-start-actions';

import './QuickStartTile.scss';

export const HIDE_QUICK_START_ADD_TILE_STORAGE_KEY = 'bridge/hide-quick-start-add-tile';

type QuickStartTileProps = {
  quickStarts: QuickStart[];
};

type DispatchProps = {
  setActiveQuickStart?: (quickStartID: string, totalTasks: number) => void;
};

type Props = QuickStartTileProps & DispatchProps;

const QuickStartTile: React.FC<Props> = ({ setActiveQuickStart, quickStarts }) => {
  const isQuickStartTileHidden =
    localStorage.getItem(HIDE_QUICK_START_ADD_TILE_STORAGE_KEY) === 'true';
  const [showTile, setShowTile] = React.useState<boolean>(!isQuickStartTileHidden);
  const [isOpen, setOpen] = React.useState<boolean>(false);

  const onRemove = () => {
    localStorage.setItem(HIDE_QUICK_START_ADD_TILE_STORAGE_KEY, 'true');
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
  const slicedQuickStarts = quickStarts.length > 3 ? quickStarts.slice(0, 3) : quickStarts;

  return slicedQuickStarts.length > 0 && showTile ? (
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
          {slicedQuickStarts.map((tour) => {
            const {
              metadata: { name },
              spec: { displayName, tasks },
            } = tour;

            return (
              <div key={name} className="odc-quick-start-tile__tour">
                <Button
                  variant="link"
                  onClick={() => setActiveQuickStart(name, tasks.length)}
                  isInline
                >
                  {displayName}
                </Button>
              </div>
            );
          })}
        </CardBody>
        <CardFooter className="odc-quick-start-tile__footer">
          <Link to="/quickstart">
            See all Quick Starts <ArrowRightIcon className="odc-quick-start-tile__arrow" />
          </Link>
        </CardFooter>
      </Card>
    </GalleryItem>
  ) : null;
};

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  setActiveQuickStart: (quickStartID: string, totalTasks: number) =>
    dispatch(QuickStartActions.setActiveQuickStart(quickStartID, totalTasks)),
});

export const InternalQuickStartTile = QuickStartTile; // for testing

export default connect<{}, DispatchProps, QuickStartTileProps>(
  null,
  mapDispatchToProps,
)(QuickStartTile);
