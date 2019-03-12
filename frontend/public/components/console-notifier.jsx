import * as React from 'react';
import * as _ from 'lodash-es';

import { Firehose } from './utils';
import { referenceForModel } from '../module/k8s';
import { ConsoleNotificationModel } from '../models/index';

const ConsoleNotifier_ = ({obj}) => {
  const { data } = obj;

  return !_.isEmpty(data)
    ? _.map(data, n => <div key={n.metadata.uid} className="co-global-notification">
      <div className="co-global-notification__content">
        <p className="co-global-notification__text">
          {n.spec.notification.text} {_.get(n.spec.notification, ['link', 'href']) && <a href={n.spec.notification.link.href}>{n.spec.notification.link.text || 'More info'}</a>}
        </p>
      </div>
    </div>)
    : null;
};

export const ConsoleNotifier = () => {
  const consoleNotificationResources = [
    {
      kind: referenceForModel(ConsoleNotificationModel),
      isList: true,
      prop: 'obj',
    },
  ];
  return <Firehose resources={consoleNotificationResources}>
    <ConsoleNotifier_ />
  </Firehose>;
};
