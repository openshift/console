import type { FC } from 'react';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { Banner, Flex } from '@patternfly/react-core';
import { FLAGS } from '@console/shared/src/constants/common';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { referenceForModel } from '../module/k8s';
import { ConsoleNotificationModel } from '../models/index';
import { useK8sWatchResource } from './utils/k8s-watch-hook';
import type { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

type ConsoleNotification = K8sResourceCommon & {
  spec: {
    location?: 'BannerTop' | 'BannerBottom' | 'BannerTopBottom';
    backgroundColor?: string;
    color?: string;
    text: string;
    link?: {
      href: string;
      text?: string;
    };
  };
};

type ConsoleNotifierProps = {
  location: 'BannerTop' | 'BannerBottom' | 'BannerTopBottom';
};

export const ConsoleNotifier: FC<ConsoleNotifierProps> = ({ location }) => {
  const shouldFetch = useFlag(FLAGS.CONSOLE_NOTIFICATION);
  const [notifications, loaded, loadError] = useK8sWatchResource<ConsoleNotification[]>(
    shouldFetch
      ? {
          kind: referenceForModel(ConsoleNotificationModel),
          isList: true,
        }
      : null,
  );

  if (loadError) {
    // eslint-disable-next-line no-console
    console.error('Error loading console notifications:', loadError);
    return null;
  }

  if (!loaded || !notifications?.length) {
    return null;
  }

  return (
    <>
      {notifications.map((notification) =>
        notification.spec.location === location ||
        notification.spec.location === 'BannerTopBottom' ||
        // notification.spec.location is optional
        // render the notification BannerTop if location is not specified
        (!notification.spec.location && location === 'BannerTop') ? (
          <Banner
            style={{
              backgroundColor: notification.spec.backgroundColor,
              color: notification.spec.color,
            }}
            key={notification.metadata.uid}
            data-test={`${notification.metadata.name}-${notification.spec.location}`}
          >
            <Flex justifyContent={{ default: 'justifyContentCenter' }}>
              <p className="pf-v6-u-text-align-center">
                {notification.spec.text}{' '}
                {notification.spec.link?.href && (
                  <ExternalLink
                    href={notification.spec.link.href}
                    style={{ color: notification.spec.color }}
                  >
                    {notification.spec.link.text || 'More info'}
                  </ExternalLink>
                )}
              </p>
            </Flex>
          </Banner>
        ) : null,
      )}
    </>
  );
};
ConsoleNotifier.displayName = 'ConsoleNotifier';
