import { action, ActionType } from 'typesafe-actions';
import {
  QuickStartStatus,
  QuickStartTaskStatus,
} from '../../components/quick-starts/utils/quick-start-types';

export enum Actions {
  SetActiveQuickStart = 'setActiveQuickStart',
  SetQuickStartStatus = 'setQuickStartStatus',
  SetQuickStartTaskNumber = 'setQuickStartTaskNumber',
  SetQuickStartTaskStatus = 'setQuickStartTaskStatus',
}

export const setActiveQuickStart = (quickStartId: string, totalTasks?: number) =>
  action(Actions.SetActiveQuickStart, { quickStartId, totalTasks });

export const setQuickStartStatus = (quickStartId: string, quickStartStatus: QuickStartStatus) =>
  action(Actions.SetQuickStartStatus, { quickStartId, quickStartStatus });

export const setQuickStartTaskNumber = (quickStartTaskNumber: number) =>
  action(Actions.SetQuickStartTaskNumber, { quickStartTaskNumber });

export const setQuickStartTaskStatus = (quickStartTaskStatus: QuickStartTaskStatus) =>
  action(Actions.SetQuickStartTaskStatus, { quickStartTaskStatus });

const actions = {
  setActiveQuickStart,
  setQuickStartStatus,
  setQuickStartTaskNumber,
  setQuickStartTaskStatus,
};

export type QuickStartSidebarActions = ActionType<typeof actions>;
