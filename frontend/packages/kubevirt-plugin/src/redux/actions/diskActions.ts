export enum DiskActionsNames {
  removeRootdisk = 'REMOVE_ROOTDISK',
  setInitialRootdisk = 'SET_INITIAL_ROOTDISK',
}

type DiskActionsType = (val?: {
  [key: string]: string;
}) => {
  type: string;
  payload?: { [key: string]: string };
};

type DiskActions = {
  [key in DiskActionsNames]: DiskActionsType;
};

export const DiskActions: DiskActions = {
  [DiskActionsNames.removeRootdisk]: (val: { [key: string]: string }) => ({
    type: DiskActionsNames.removeRootdisk,
    payload: val,
  }),
  [DiskActionsNames.setInitialRootdisk]: () => ({
    type: DiskActionsNames.setInitialRootdisk,
  }),
};
