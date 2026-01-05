import type { ReactElement, MouseEvent, ChangeEvent, FC } from 'react';
import {
  Flex,
  FlexItem,
  Content,
  ContentVariants,
  Title,
  TitleSizes,
  Button,
  SimpleList,
  Skeleton,
  SimpleListItem,
  Icon,
} from '@patternfly/react-core';
import { ArrowRightIcon, ExternalLinkAltIcon } from '@patternfly/react-icons';
import { Link } from 'react-router-dom-v5-compat';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import './GettingStartedCard.scss';

export interface GettingStartedLink {
  id: string;
  loading?: boolean;

  title?: string | ReactElement;
  description?: string;

  external?: boolean;
  /** Default hyperlink location */
  href?: string;
  /** OnClick callback for the SimpleList item */
  onClick?: (event: MouseEvent | ChangeEvent) => void;
}

export interface GettingStartedCardProps {
  id: string;
  icon?: ReactElement;
  title: string;
  titleColor?: string;
  description?: string;
  links: GettingStartedLink[];
  moreLink?: GettingStartedLink;
}

export const GettingStartedCard: FC<GettingStartedCardProps> = ({
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
        <Content component={ContentVariants.small} data-test="description">
          {description}
        </Content>
      ) : null}

      <Flex direction={{ default: 'column' }} grow={{ default: 'grow' }}>
        {links?.length > 0 ? (
          <SimpleList isControlled={false} className="ocs-getting-started-card__list">
            {links.map((link) =>
              link.loading ? (
                <li key={link.id} data-test="getting-started-skeleton">
                  <Skeleton fontSize="sm" />
                </li>
              ) : (
                <SimpleListItem
                  key={link.id}
                  component={link.href ? (link.external ? 'a' : (Link as any)) : 'button'}
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
                  <>
                    <Content component="p">
                      {link.title}
                      <Icon size="bodySm" className="pf-v6-u-ml-xs">
                        {link.external ? <ExternalLinkAltIcon /> : <ArrowRightIcon />}
                      </Icon>
                    </Content>
                    {link.description && (
                      <Content component={ContentVariants.small}>{link.description}</Content>
                    )}
                  </>
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
            <ExternalLink
              onClick={telemetryCallback}
              href={moreLink.href}
              data-test={`item ${moreLink.id}`}
            >
              {moreLink.title}
            </ExternalLink>
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
