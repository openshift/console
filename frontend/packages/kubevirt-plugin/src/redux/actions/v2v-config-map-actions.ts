export enum v2vConfigMapActionsNames {
  updateImages = 'UPDATE_IMAGES',
}

type v2vConfigMapActionsType = (val?: {
  [key: string]: string;
}) => {
  type: string;
  payload: { [key: string]: string };
};

type v2vConfigMapActions = {
  [key in v2vConfigMapActionsNames]: v2vConfigMapActionsType;
};

export const v2vConfigMapActions: v2vConfigMapActions = {
  [v2vConfigMapActionsNames.updateImages]: (val: { [key: string]: string }) => ({
    type: v2vConfigMapActionsNames.updateImages,
    payload: val,
  }),
};
