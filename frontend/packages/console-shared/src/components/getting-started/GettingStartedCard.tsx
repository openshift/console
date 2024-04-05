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
import { Link } from 'react-router-dom-v5-compat';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';

import './GettingStartedCard.scss';

export interface GettingStartedLink {
  id: string;
  loading?: boolean;

  title?: string | React.ReactElement;
  description?: string;

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
  const fireTelemetryEvent = useTelemetry();
  const [activePerspective] = useActivePerspective();

  const telemetryCallback = () => {
    fireTelemetryEvent('Getting Started Card Link Clicked', {
      id: activePerspective,
    });
  };
  const getLinkTitleClassNames = (external: boolean) =>
    external ? 'co-external-link pf-v5-u-display-block' : 'co-goto-arrow';

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
                  componentClassName={link.description ? '' : getLinkTitleClassNames(link.external)}
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
                  href={link.href}
                  onClick={(e) => {
                    telemetryCallback();
                    link.onClick?.(e);
                  }}
                >
                  {link.description ? (
                    <>
                      <Text className={getLinkTitleClassNames(link.external)}>{link.title}</Text>
                      <Text component={TextVariants.small}>{link.description}</Text>
                    </>
                  ) : (
                    link.title
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
            <Button
              onClick={(e) => {
                telemetryCallback();
                moreLink.onClick(e);
              }}
              isInline
              variant="link"
              data-test={`item ${moreLink.id}`}
            >
              {moreLink.title}
            </Button>
          ) : moreLink.external ? (
            <a
              onClick={telemetryCallback}
              href={moreLink.href}
              target="_blank"
              className="co-external-link"
              rel="noopener noreferrer"
              data-test={`item ${moreLink.id}`}
            >
              {moreLink.title}
            </a>
          ) : (
            <Link to={moreLink.href} data-test={`item ${moreLink.id}`} onClick={telemetryCallback}>
              {moreLink.title}
            </Link>
          )}
        </FlexItem>
      ) : null}
    </Flex>
  );
};
