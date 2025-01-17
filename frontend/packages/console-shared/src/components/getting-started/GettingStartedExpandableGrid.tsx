import * as React from 'react';
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
  children?: React.ReactNodeArray;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  setShowState?: (showState: GettingStartedShowState) => void;
}

export const GettingStartedExpandableGrid: React.FC<GettingStartedExpandableGridProps> = ({
  children,
  isOpen,
  setIsOpen,
  setShowState,
}) => {
  const { t } = useTranslation();

  const title = t('console-shared~Getting started resources');
  const titleTooltip = (
    <span className="ocs-getting-started-expandable-grid__tooltip">
      {t(
        'console-shared~Use our collection of resources to help you get started with the Console.',
      )}
    </span>
  );

  const handleClose = () => {
    setShowState(GettingStartedShowState.HIDE);
  };

  return (
    <Card
      className="ocs-getting-started-expandable-grid"
      variant="secondary"
      data-test="getting-started"
      isClickable
      isSelectable
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
      >
        <CardTitle data-test="title">
          {title}{' '}
          <Popover bodyContent={titleTooltip} triggerAction="hover">
            <span role="button" aria-label={t('console-shared~More info')}>
              <OutlinedQuestionCircleIcon />
            </span>
          </Popover>
        </CardTitle>
      </CardHeader>
      <CardExpandableContent>
        <CardBody className="ocs-getting-started-expandable-grid__content">{children}</CardBody>
      </CardExpandableContent>
    </Card>
  );
};
