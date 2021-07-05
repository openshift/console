import * as React from 'react';
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
import { Link } from 'react-router-dom';

import './GettingStartedCard.scss';

export interface GettingStartedLink {
  id: string;
  loading?: boolean;

  title?: string;

  external?: boolean;
  /** Default hyperlink location */
  href?: string;
  /** OnClick callback for the SimpleList item */
  onClick?: (event: React.MouseEvent | React.ChangeEvent) => void;
}

export interface GettingStartedCardProps {
  id: string;
  icon?: React.ReactElement;
  title: string;
  titleColor?: string;
  description?: string;
  links: GettingStartedLink[];
  moreLink?: GettingStartedLink;
}

export const GettingStartedCard: React.FC<GettingStartedCardProps> = ({
  id,
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
      data-test={`card ${id}`}
    >
      <Title headingLevel="h3" size={TitleSizes.md} style={{ color: titleColor }} data-test="title">
        {icon ? <span className="ocs-getting-started-card__title-icon">{icon}</span> : null}
        {title}
      </Title>

      {description ? (
        <Text component={TextVariants.small} data-test="description">
          {description}
        </Text>
      ) : null}

      <Flex direction={{ default: 'column' }} grow={{ default: 'grow' }}>
        {links?.length > 0 ? (
          <SimpleList isControlled={false} className="ocs-getting-started-card__list">
            {links.map((link) =>
              link.loading ? (
                <li key={link.id}>
                  <Skeleton fontSize="sm" />
                </li>
              ) : (
                <SimpleListItem
                  key={link.id}
                  component={link.href ? (link.external ? 'a' : (Link as any)) : 'button'}
                  componentClassName={link.external ? 'co-external-link' : 'co-goto-arrow'}
                  componentProps={
                    link.external
                      ? {
                          href: link.href,
                          target: '_blank',
                          rel: 'noopener noreferrer',
                          'data-test': `item ${link.id}`,
                        }
                      : {
                          to: link.href,
                          'data-test': `item ${link.id}`,
                        }
                  }
                  onClick={link.onClick}
                >
                  {link.title}
                </SimpleListItem>
              ),
            )}
          </SimpleList>
        ) : null}
      </Flex>

      {moreLink ? (
        <FlexItem>
          {moreLink.onClick ? (
            <Button
              onClick={moreLink.onClick}
              isInline
              variant="link"
              data-test={`item ${moreLink.id}`}
            >
              {moreLink.title}
            </Button>
          ) : moreLink.external ? (
            <a
              href={moreLink.href}
              target="_blank"
              className="co-external-link"
              rel="noopener noreferrer"
              data-test={`item ${moreLink.id}`}
            >
              {moreLink.title}
            </a>
          ) : (
            <Link to={moreLink.href} data-test={`item ${moreLink.id}`}>
              {moreLink.title}
            </Link>
          )}
        </FlexItem>
      ) : null}
    </Flex>
  );
};
