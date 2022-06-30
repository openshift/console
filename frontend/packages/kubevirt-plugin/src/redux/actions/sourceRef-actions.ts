import { DataSourceKind } from '../../types';

export enum SourceRefActionsNames {
  updateValue = 'UPDATE_VALUES_SOURCEREF',
  clearValues = 'CLEAR_VALUES_SOURCEREF',
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
