import { DataSourceKind } from '../../types';

export enum SourceRefActionsNames {
  updateValue = 'UPDATE_VALUES',
  clearValues = 'CLEAR_VALUES',
}

type SourceRefActionsType = (
  val?: DataSourceKind,
) => {
  type: string;
  payload?: DataSourceKind;
};

type SourceRefActions = {
  [key in SourceRefActionsNames]: SourceRefActionsType;
};

export const SourceRefActions: SourceRefActions = {
  [SourceRefActionsNames.updateValue]: (val: DataSourceKind) => ({
    type: SourceRefActionsNames.updateValue,
    payload: val,
  }),
  [SourceRefActionsNames.clearValues]: () => ({
    type: SourceRefActionsNames.clearValues,
  }),
};
