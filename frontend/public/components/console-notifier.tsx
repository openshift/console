/* eslint-disable no-undef */
import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';

import { UIActions } from '../ui/ui-actions';
import { Firehose, CloseButton } from './utils';
import { referenceForModel } from '../module/k8s';
import { ConsoleNotificationModel } from '../models/index';

const stateToProps = ({UI}) => ({
  dismissedNotifications: UI.get('dismissedConsoleNotifications'),
});

const dispatchToProps = dispatch => ({
  dismiss: (uid: string) => dispatch(UIActions.setDismissibleConsoleNotification(uid)),
});

const ConsoleNotifier_ = connect(stateToProps, dispatchToProps)(({obj: {data}, position, dismissedNotifications, dismiss}: ConsoleNotifierProps) => {
  if (_.isEmpty(data)) {
    return null;
  }

  return <React.Fragment>
    {_.map(data, notification => (notification.spec.position === position || notification.spec.position === 'topBottom') && !_.includes(dismissedNotifications, notification.metadata.uid)
      ? <div key={notification.metadata.uid}
        className="co-global-notification"
        style={{
          backgroundColor: notification.spec.backgroundColor,
          color: notification.spec.color,
        }}>
        <div className="co-global-notification__content">
          {notification.spec.dismissible && <CloseButton onClick={() => dismiss(notification.metadata.uid)} />}
          <p className="co-global-notification__text">
            {notification.spec.text} {_.get(notification.spec, ['link', 'href'])
              && <a href={notification.spec.link.href}
                target={notification.spec.link.opensNewWindow ? '_blank' : null}
                className={notification.spec.link.opensNewWindow ? 'co-external-link' : null}
                style={{color: notification.spec.color}}>{notification.spec.link.text || 'More info'}</a>}
          </p>
        </div>
      </div>
      : null)}
  </React.Fragment>;
});
ConsoleNotifier_.displayName = 'ConsoleNotifier_';

export const ConsoleNotifier: React.FC<{}> = props => {
  const consoleNotificationResources = [
    {
      kind: referenceForModel(ConsoleNotificationModel),
      isList: true,
      prop: 'obj',
    },
  ];
  return <Firehose resources={consoleNotificationResources}>
    <ConsoleNotifier_ {...props as ConsoleNotifierProps} />
  </Firehose>;
};
ConsoleNotifier.displayName = 'ConsoleNotifier';

type ConsoleNotifierProps = {
  obj: any;
  position: string;
  dismissedNotifications: string[];
  dismiss: (uid: string) => void;
};
