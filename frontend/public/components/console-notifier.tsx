import * as React from 'react';
import * as _ from 'lodash-es';

import { FLAGS } from '@console/shared';
import { connectToFlags } from '@console/shared/src/hocs/connect-flags';
import { Firehose, FirehoseResult } from './utils';
import { referenceForModel } from '../module/k8s';
import { ConsoleNotificationModel } from '../models/index';

const ConsoleNotifier_: React.FC<ConsoleNotifierProps> = ({ obj, location }) => {
  if (_.isEmpty(obj)) {
    return null;
  }

  return (
    <>
      {_.map(_.get(obj, 'data'), (notification) =>
        notification.spec.location === location ||
        notification.spec.location === 'BannerTopBottom' ? (
          <div
            key={notification.metadata.uid}
            className="co-global-notification"
            style={{
              backgroundColor: notification.spec.backgroundColor,
              color: notification.spec.color,
            }}
            data-test={`${notification.metadata.name}-${notification.spec.location}`}
          >
            <div className="co-global-notification__content">
              <p className="co-global-notification__text">
                {notification.spec.text}{' '}
                {_.get(notification.spec, ['link', 'href']) && (
                  <a
                    href={notification.spec.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="co-external-link"
                    style={{ color: notification.spec.color }}
                  >
                    {notification.spec.link.text || 'More info'}
                  </a>
                )}
              </p>
            </div>
          </div>
        ) : null,
      )}
    </>
  );
};
ConsoleNotifier_.displayName = 'ConsoleNotifier_';

export const ConsoleNotifier = connectToFlags(FLAGS.CONSOLE_NOTIFICATION)(({ flags, ...props }) => {
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
      <ConsoleNotifier_ {...(props as ConsoleNotifierProps)} />
    </Firehose>
  );
});
ConsoleNotifier.displayName = 'ConsoleNotifier';

type ConsoleNotifierProps = {
  obj: FirehoseResult;
  location: 'BannerTop' | 'BannerBottom' | 'BannerTopBottom';
};
