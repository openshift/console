import type { ReactNodeArray, ReactNode, FC } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardExpandableContent,
  Popover,
} from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon';
import { useTranslation } from 'react-i18next';
import { GettingStartedShowState } from './useGettingStartedShowState';

import './GettingStartedExpandableGrid.scss';

interface GettingStartedExpandableGridProps {
  children?: ReactNodeArray;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  setShowState?: (showState: GettingStartedShowState) => void;
  /** Optional title content. Defaults to "Getting started" */
  title?: ReactNode;
  /** Optional tooltip content placed after the title. Has default content. */
  titleTooltip?: ReactNode | false;
  /** Optional header content */
  headerContent?: ReactNode;
  /** Optional footer content */
  footerContent?: ReactNode;
}

const TitleContent = () => {
  const { t } = useTranslation();
  return <>{t('console-shared~Getting started resources')}</>;
};

const TitlePopoverContent = () => {
  const { t } = useTranslation();

  return (
    <span className="ocs-getting-started-expandable-grid__tooltip">
      {t(
        'console-shared~Use our collection of resources to help you get started with the Console.',
      )}
    </span>
  );
};

export const GettingStartedExpandableGrid: FC<GettingStartedExpandableGridProps> = ({
  children,
  isOpen,
  setIsOpen,
  setShowState,
  title = <TitleContent />,
  titleTooltip = <TitlePopoverContent />,
  headerContent,
  footerContent,
}) => {
  const { t } = useTranslation();

  const handleClose = () => {
    setShowState(GettingStartedShowState.HIDE);
  };

  return (
    <Card
      className="ocs-getting-started-expandable-grid"
      variant="secondary"
      data-test="getting-started"
      isExpanded={isOpen}
    >
      <CardHeader
        onExpand={() => setIsOpen(!isOpen)}
        actions={
          setShowState && {
            actions: (
              <Button
                variant="plain"
                aria-label={t('console-shared~Close')}
                icon={<TimesIcon />}
                onClick={handleClose}
              />
            ),
          }
        }
        toggleButtonProps={{
          id: 'toggle-button1',
          'aria-label': t('console-shared~Expandable details'),
          'aria-labelledby': 'expandable-card-title toggle-button1',
          'aria-expanded': isOpen,
        }}
      >
        <CardTitle data-test="title" id="expandable-card-title">
          {title}{' '}
          {titleTooltip && (
            <Popover bodyContent={titleTooltip} triggerAction="hover">
              <span role="button" aria-label={t('console-shared~More info')}>
                <OutlinedQuestionCircleIcon />
              </span>
            </Popover>
          )}
        </CardTitle>
      </CardHeader>
      <CardExpandableContent>
        {headerContent && headerContent}
        <CardBody
          data-test="getting-started-content"
          className="ocs-getting-started-expandable-grid__content"
        >
          {children}
        </CardBody>
        {footerContent && footerContent}
      </CardExpandableContent>
    </Card>
  );
};
