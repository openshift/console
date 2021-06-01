import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardHeader,
  CardActions,
  CardTitle,
  CardBody,
  Title,
  TitleSizes,
  Dropdown,
  DropdownItem,
  KebabToggle,
  Popover,
} from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';

import './GettingStartedGrid.scss';

interface GettingStartedGridProps {
  onHide?: () => void;
  children?: React.ReactNodeArray;
}

export const GettingStartedGrid: React.FC<GettingStartedGridProps> = ({ onHide, children }) => {
  const { t } = useTranslation();

  const [menuIsOpen, setMenuIsOpen] = React.useState(false);
  const onToggle = () => setMenuIsOpen((open) => !open);

  const actionDropdownItem: any[] = [];

  if (onHide) {
    actionDropdownItem.push(
      <DropdownItem
        key="action"
        component="button"
        description={t(
          'console-shared~You can always bring these getting started resources back into view by clicking Show getting started resources in the page heading.',
        )}
        onClick={onHide}
        data-test="hide"
      >
        {t('console-shared~Hide from view')}
      </DropdownItem>,
    );
  }

  const title = t('console-shared~Getting started resources');
  const titleTooltip = (
    <span className="ocs-getting-started-grid__tooltip">
      {t(
        'console-shared~Use our collection of resources to help you get started with the Console.\n\nNote: This card can be hidden at any time.',
      )}
    </span>
  );

  return (
    <Card className="ocs-getting-started-grid" data-test="getting-started">
      <CardHeader className="ocs-getting-started-grid__header">
        <CardTitle>
          <Title headingLevel="h2" size={TitleSizes.lg} data-test="title">
            {title}{' '}
            <Popover bodyContent={titleTooltip}>
              <span
                aria-label={t('console-shared~More info')}
                className="ocs-getting-started-grid__tooltip-icon"
              >
                <OutlinedQuestionCircleIcon />
              </span>
            </Popover>
          </Title>
        </CardTitle>
        {actionDropdownItem.length > 0 ? (
          <CardActions>
            <Dropdown
              isOpen={menuIsOpen}
              isPlain
              toggle={<KebabToggle onToggle={onToggle} data-test="actions" />}
              position="right"
              dropdownItems={actionDropdownItem}
              className="ocs-getting-started-grid__action-dropdown"
            />
          </CardActions>
        ) : null}
      </CardHeader>
      <CardBody className="ocs-getting-started-grid__content">{children}</CardBody>
    </Card>
  );
};
