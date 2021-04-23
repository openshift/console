import * as React from 'react';
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
import {
  QuickStart,
  QuickStartStatus,
} from '@console/app/src/components/quick-starts/utils/quick-start-types';
import { getQuickStartStatus } from '@console/app/src/components/quick-starts/utils/quick-start-utils';
import {
  QuickStartContext,
  QuickStartContextValues,
} from '@console/app/src/components/quick-starts/utils/quick-start-context';
import { useUserSettingsCompatibility } from '../../hooks';
import './QuickStartsCatalogCard.scss';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';

type QuickStartsCatalogCardProps = {
  quickStarts: QuickStart[];
  storageKey: string;
  userSettingsKey: string;
};

const QuickStartsCatalogCard: React.FC<QuickStartsCatalogCardProps> = ({
  quickStarts,
  storageKey,
  userSettingsKey,
}) => {
  const { t } = useTranslation();
  const { allQuickStartStates, setActiveQuickStart } = React.useContext<QuickStartContextValues>(
    QuickStartContext,
  );
  const [showTile, setShowTile, loaded] = useUserSettingsCompatibility(
    userSettingsKey,
    storageKey,
    true,
  );
  const [isOpen, setOpen] = React.useState<boolean>(false);
  const fireTelemetryEvent = useTelemetry();

  const onRemove = () => {
    fireTelemetryEvent('Dev Customized', {
      event: 'remove quick start card',
    });
    setShowTile(false);
  };

  const onToggle = () => setOpen(!isOpen);

  const actionDropdownItem = [
    <DropdownItem onClick={onRemove} key="action" component="button">
      {t('console-shared~Remove Quick Starts card from view')}
      <div className="odc-quick-start-catalog-card__remove-help-text text-muted co-pre-wrap">
        {t('console-shared~You will be able to access this information through the help menu.')}
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
    return null;
  }

  return loaded && slicedQuickStarts.length > 0 && showTile ? (
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

export const InternalQuickStartsCatalogCard = QuickStartsCatalogCard; // for testing

export default QuickStartsCatalogCard;
