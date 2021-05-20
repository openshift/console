import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Flex,
  FlexItem,
  Text,
  TextVariants,
  Title,
  TitleSizes,
  Button,
  SimpleList,
  Skeleton,
  SimpleListItem,
} from '@patternfly/react-core';
import { ArrowRightIcon, ExternalLinkAltIcon } from '@patternfly/react-icons';

import './GettingStartedCard.scss';

export interface GettingStartedLink {
  key: string;
  loading?: boolean;

  title?: string;

  external?: boolean;
  /** Default hyperlink location */
  href?: string;
  /** OnClick callback for the SimpleList item */
  onClick?: (event: React.MouseEvent | React.ChangeEvent) => void;
}

export interface GettingStartedCardProps {
  icon?: React.ReactElement;
  title: string;
  titleColor?: string;
  description?: string;
  links: GettingStartedLink[];
  moreLink?: GettingStartedLink;
}

export const GettingStartedCard: React.FC<GettingStartedCardProps> = ({
  icon,
  title,
  titleColor,
  description,
  links,
  moreLink,
}) => {
  return (
    <Flex
      direction={{ default: 'column' }}
      grow={{ default: 'grow' }}
      className="ocs-getting-started-card"
    >
      <Title headingLevel="h3" size={TitleSizes.md} style={{ color: titleColor }}>
        {icon ? <span className="ocs-getting-started-card__title-icon">{icon}</span> : null}
        {title}
      </Title>

      {description ? <Text component={TextVariants.small}>{description}</Text> : null}

      <Flex direction={{ default: 'column' }} grow={{ default: 'grow' }}>
        {links?.length > 0 ? (
          <SimpleList isControlled={false} className="ocs-getting-started-card__list">
            {links.map((link) =>
              link.loading ? (
                <li key={link.key}>
                  <Skeleton fontSize="sm" />
                </li>
              ) : (
                <SimpleListItem
                  key={link.key}
                  component={link.href ? (link.external ? 'a' : (Link as any)) : 'button'}
                  componentProps={
                    link.external
                      ? { href: link.href, target: '_blank', rel: 'noopener noreferrer' }
                      : { to: link.href }
                  }
                  onClick={link.onClick}
                >
                  {link.title}
                  {link.external ? (
                    <ExternalLinkAltIcon aria-hidden="true" />
                  ) : (
                    <ArrowRightIcon aria-hidden="true" />
                  )}
                </SimpleListItem>
              ),
            )}
          </SimpleList>
        ) : null}
      </Flex>

      {moreLink ? (
        <FlexItem>
          {moreLink.onClick ? (
            <Button onClick={moreLink.onClick} isInline variant="link">
              {moreLink.title}
            </Button>
          ) : moreLink.external ? (
            <a href={moreLink.href} target="_blank" rel="noopener noreferrer">
              {moreLink.title}
              <ExternalLinkAltIcon />
            </a>
          ) : (
            <Link to={moreLink.href}>{moreLink.title}</Link>
          )}
        </FlexItem>
      ) : null}
    </Flex>
  );
};
