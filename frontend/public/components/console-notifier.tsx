import type { FC } from 'react';
import * as _ from 'lodash-es';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { Banner, Flex } from '@patternfly/react-core';
import { FLAGS } from '@console/shared/src/constants/common';
import { connectToFlags, WithFlagsProps } from '../reducers/connectToFlags';
import { Firehose } from './utils/firehose';
import { FirehoseResult } from './utils/types';
import { referenceForModel } from '../module/k8s';
import { ConsoleNotificationModel } from '../models/index';

type ConsoleNotifierProps = {
  location: 'BannerTop' | 'BannerBottom' | 'BannerTopBottom';
};

type PrivateConsoleNotifierProps = ConsoleNotifierProps & {
  obj: FirehoseResult;
};

const ConsoleNotifier_: FC<PrivateConsoleNotifierProps> = ({ obj, location }) => {
  if (_.isEmpty(obj)) {
    return null;
  }

  return (
    <>
      {_.map(_.get(obj, 'data'), (notification) =>
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
                {_.get(notification.spec, ['link', 'href']) && (
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
ConsoleNotifier_.displayName = 'ConsoleNotifier_';

export const ConsoleNotifier = connectToFlags<ConsoleNotifierProps & WithFlagsProps>(
  FLAGS.CONSOLE_NOTIFICATION,
)(({ flags, ...props }) => {
  const resources = flags[FLAGS.CONSOLE_NOTIFICATION]
    ? [
        {
          kind: referenceForModel(ConsoleNotificationModel),
          isList: true,
          prop: 'obj',
        },
      ]
    : [];
  return (
    <Firehose resources={resources}>
      <ConsoleNotifier_ {...(props as PrivateConsoleNotifierProps)} />
    </Firehose>
  );
});
ConsoleNotifier.displayName = 'ConsoleNotifier';
