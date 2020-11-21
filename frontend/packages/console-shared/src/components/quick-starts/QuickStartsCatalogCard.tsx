import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { RootState } from '@console/internal/redux';
import {
  QuickStart,
  AllQuickStartStates,
  QuickStartStatus,
} from '@console/app/src/components/quick-starts/utils/quick-start-types';
import {
  getActiveQuickStartID,
  getAllQuickStartStates,
} from '@console/app/src/redux/reducers/quick-start-reducer';
import * as QuickStartActions from '@console/app/src/redux/actions/quick-start-actions';
import { getQuickStartStatus } from '@console/app/src/components/quick-starts/utils/quick-start-utils';

import './QuickStartsCatalogCard.scss';

type QuickStartsCatalogCardProps = {
  quickStarts: QuickStart[];
  storageKey: string;
  onRemoveTile?: () => void;
};

type StateProps = {
  activeQuickStartID?: string;
  allQuickStartStates?: AllQuickStartStates;
};

type DispatchProps = {
  setActiveQuickStart?: (quickStartID: string, totalTasks: number) => void;
};

type Props = QuickStartsCatalogCardProps & DispatchProps & StateProps;

const QuickStartsCatalogCard: React.FC<Props> = ({
  setActiveQuickStart,
  quickStarts,
  allQuickStartStates,
  onRemoveTile,
  storageKey,
}) => {
  const { t } = useTranslation();
  const isQuickStartTileHidden = localStorage.getItem(storageKey) === 'true';
  const [showTile, setShowTile] = React.useState<boolean>(!isQuickStartTileHidden);
  const [isOpen, setOpen] = React.useState<boolean>(false);

  const onRemove = () => {
    localStorage.setItem(storageKey, 'true');
    setShowTile(false);
    onRemoveTile && onRemoveTile();
  };

  const onToggle = () => setOpen(!isOpen);

  const actionDropdownItem = [
    <DropdownItem onClick={onRemove} key="action" component="button">
      {t('console-shared~Remove quick starts card from view')}
      <div className="odc-quick-start-catalog-card__remove-help-text text-muted co-pre-wrap">
        {t('console-shared~You will be able to access this information through the Help menu.')}
      </div>
    </DropdownItem>,
  ];

  const slicedQuickStarts: QuickStart[] = [];

  quickStarts.forEach((quickStart) => {
    if (
      slicedQuickStarts.length < 3 &&
      getQuickStartStatus(allQuickStartStates, quickStart.metadata.name) ===
        QuickStartStatus.IN_PROGRESS
    ) {
      slicedQuickStarts.push(quickStart);
    }
  });

  if (slicedQuickStarts.length !== 3) {
    quickStarts.forEach((quickStart) => {
      if (
        slicedQuickStarts.length < 3 &&
        getQuickStartStatus(allQuickStartStates, quickStart.metadata.name) ===
          QuickStartStatus.NOT_STARTED
      ) {
        slicedQuickStarts.push(quickStart);
      }
    });
  }

  if (quickStarts.length > 0 && slicedQuickStarts.length === 0) {
    onRemoveTile && onRemoveTile();
    return null;
  }

  return slicedQuickStarts.length > 0 && showTile ? (
    <GalleryItem>
      <Card className="odc-quick-start-catalog-card__card">
        <CardHeader>
          <CardHeaderMain>
            <Title headingLevel="h1" size="xl">
              {t('console-shared~Quick Starts')}
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
              <div key={name} className="odc-quick-start-catalog-card__tour">
                <Button
                  variant="link"
                  onClick={() => setActiveQuickStart(name, tasks.length)}
                  isInline
                >
                  <span className="odc-quick-start-catalog-card__tour-name">{displayName}</span>
                </Button>
                {getQuickStartStatus(allQuickStartStates, name) ===
                  QuickStartStatus.IN_PROGRESS && (
                  <div className="text-muted odc-quick-start-catalog-card__tour-status">
                    {getQuickStartStatus(allQuickStartStates, name)}
                  </div>
                )}
              </div>
            );
          })}
        </CardBody>
        <CardFooter className="odc-quick-start-catalog-card__footer">
          <Link to="/quickstart">
            {t('console-shared~View all Quick Starts')}{' '}
            <ArrowRightIcon className="odc-quick-start-catalog-card__arrow" />
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

const mapStateToProps = (state: RootState): StateProps => ({
  activeQuickStartID: getActiveQuickStartID(state),
  allQuickStartStates: getAllQuickStartStates(state),
});

export const InternalQuickStartsCatalogCard = QuickStartsCatalogCard; // for testing

export default connect<StateProps, DispatchProps, QuickStartsCatalogCardProps>(
  mapStateToProps,
  mapDispatchToProps,
)(QuickStartsCatalogCard);
