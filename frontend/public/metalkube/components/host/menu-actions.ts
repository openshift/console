import { Kebab } from '../utils/okdutils';

const menuActionDrainHost = (kind, host) => ({
  hidden: false, // TODO(jtomasek): use canDrainHost selector
  label: 'Drain Host',
  callback: () => {
    // eslint-disable-next-line no-console
    console.log(host);
  },
});

const menuActionStartMaintenance = (kind, host) => ({
  hidden: false,
  label: 'Start Maintenance',
  callback: () => {
    // eslint-disable-next-line no-console
    console.log(host);
  },
});

export const menuActions = [
  menuActionDrainHost,
  menuActionStartMaintenance,
  ...Kebab.factory.common,
];
