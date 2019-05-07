import { rowForName } from '../crud.view';

export const listViewReadyStatusForNode = (name: string) => rowForName(name).$('.co-icon-and-text');
export const listViewMaintenanceStatusForNode = (name: string) => rowForName(name).$('.kubevirt-status__button');
