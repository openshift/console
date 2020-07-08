import * as React from 'react';
import * as _ from 'lodash';
import { NotificationDrawerGroup, NotificationDrawerList } from '@patternfly/react-core';

export interface CriticalAlertCategoryWrapperProps {
  title: string;
  count: number;
  alertList: React.ReactNode[];
  children: React.ReactElement;
}
export interface OtherAlertCategoryWrapperProps {
  title: string;
  count: number;
  alertList: React.ReactNode[];
}

export const CriticalAlertCategoryWrapper: React.FC<CriticalAlertCategoryWrapperProps> = ({
  title,
  count,
  alertList,
  children,
}) => {
  const [isAlertExpanded, toggleAlertExpanded] = React.useState<boolean>(!_.isEmpty(alertList));
  return (
    <NotificationDrawerGroup
      isExpanded={isAlertExpanded}
      title={title}
      count={count}
      isRead
      onExpand={() => {
        toggleAlertExpanded(!isAlertExpanded);
      }}
    >
      <NotificationDrawerList isHidden={!isAlertExpanded}>{children}</NotificationDrawerList>
    </NotificationDrawerGroup>
  );
};

export const OtherAlertCategoryWrapper: React.FC<OtherAlertCategoryWrapperProps> = ({
  title,
  count,
  alertList,
}) => {
  const [isAlertExpanded, toggleAlertExpanded] = React.useState<boolean>(true);
  return (
    <NotificationDrawerGroup
      isExpanded={isAlertExpanded}
      title={title}
      count={count}
      isRead
      onExpand={() => {
        toggleAlertExpanded(!isAlertExpanded);
      }}
    >
      <NotificationDrawerList isHidden={!isAlertExpanded}>{alertList}</NotificationDrawerList>
    </NotificationDrawerGroup>
  );
};
