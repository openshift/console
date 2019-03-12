/* eslint-disable no-undef */

import * as React from 'react';
import * as _ from 'lodash-es';

import { Firehose } from './utils';
import { referenceForModel } from '../module/k8s';
import { ConsoleNotificationModel } from '../models/index';

const ConsoleNotifier_ = ({ obj: {data}, position }) => <React.Fragment>
  {!_.isEmpty(data)
    ? _.map(data, n => (n.spec.notification.position === position || n.spec.notification.position === 'topBottom')
      ? <div key={n.metadata.uid}
        className="co-global-notification"
        style={{
          backgroundColor: n.spec.notification.backgroundColor,
          color: n.spec.notification.color,
        }}>
        <div className="co-global-notification__content">
          <p className="co-global-notification__text">
            {n.spec.notification.text} {_.get(n.spec.notification, ['link', 'href'])
              && <a href={n.spec.notification.link.href}
                target={n.spec.notification.link.opensNewWindow ? '_blank' : null}
                className={n.spec.notification.link.opensNewWindow ? 'co-external-link' : null}
                style={{color: n.spec.notification.color}}>{n.spec.notification.link.text || 'More info'}</a>}
          </p>
        </div>
      </div>
      : null)
    : null}
</React.Fragment>;

export const ConsoleNotifier: React.SFC<ConsoleNotifierProps> = props => {
  const consoleNotificationResources = [
    {
      kind: referenceForModel(ConsoleNotificationModel),
      isList: true,
      prop: 'obj',
    },
  ];
  return <Firehose resources={consoleNotificationResources}>
    <ConsoleNotifier_ {...props} />
  </Firehose>;
};

export type ConsoleNotifierProps = {
  obj: any,
  position: string,
};
