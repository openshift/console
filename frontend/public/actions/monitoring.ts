import { ActionType as Action, action } from 'typesafe-actions';

export enum ActionType {
  SetMonitoringURL = 'setMonitoringURL',
}

export const setMonitoringURL = (name: string, url: string) => action(ActionType.SetMonitoringURL, {name, url});

const monitoringActions = {setMonitoringURL};

export type MonitoringAction = Action<typeof monitoringActions>;
