export enum SysprepActionsNames {
  updateValue = 'UPDATE_VALUES',
  clearValues = 'CLEAR_VALUES',
}

type SysprepActionsType = (val?: {
  [key: string]: string;
}) => {
  type: string;
  payload?: { [key: string]: string };
};

type SysprepActions = {
  [key in SysprepActionsNames]: SysprepActionsType;
};

export const SysprepActions: SysprepActions = {
  [SysprepActionsNames.updateValue]: (val: { [key: string]: string }) => ({
    type: SysprepActionsNames.updateValue,
    payload: val,
  }),
  [SysprepActionsNames.clearValues]: () => ({
    type: SysprepActionsNames.clearValues,
  }),
};
