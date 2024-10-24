import * as React from 'react';
import {
  Card,
  CardBody,
  Title,
  TitleSizes,
  Popover,
  ExpandableSection,
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
    <ExpandableSection
      onToggle={() => setIsOpen(!isOpen)}
      isExpanded={isOpen}
      displaySize="lg"
      className="ocs-getting-started-expandable-section"
      toggleContent={
        <div className="ocs-getting-started-expandable-section__header">
          <div className="ocs-getting-started-expandable-section__toggle-text">
            <Title headingLevel="h2" size={TitleSizes.lg} data-test="title">
              {title}{' '}
              <Popover bodyContent={titleTooltip} triggerAction="hover">
                <span
                  role="button"
                  aria-label={t('console-shared~More info')}
                  className="ocs-getting-started-expandable-grid__tooltip-icon"
                >
                  <OutlinedQuestionCircleIcon />
                </span>
              </Popover>
            </Title>
          </div>
          {setShowState && (
            <TimesIcon onClick={handleClose} className="ocs-getting-started-close-icon" />
          )}
        </div>
      }
    >
      <Card
        className="ocs-getting-started-expandable-grid"
        data-test="getting-started"
        isClickable
        isSelectable
      >
        <CardBody className="ocs-getting-started-expandable-grid__content">{children}</CardBody>
      </Card>
    </ExpandableSection>
  );
};
