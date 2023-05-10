// eslint-disable-next-line @typescript-eslint/naming-convention
export enum v2vConfigMapActionsNames {
  updateImages = 'UPDATE_IMAGES',
}

// eslint-disable-next-line @typescript-eslint/naming-convention
type v2vConfigMapActionsType = (val?: {
  [key: string]: string;
}) => {
  type: string;
  payload: { [key: string]: string };
};

// eslint-disable-next-line @typescript-eslint/naming-convention
type v2vConfigMapActions = {
  [key in v2vConfigMapActionsNames]: v2vConfigMapActionsType;
};

export const v2vConfigMapActions: v2vConfigMapActions = {
  [v2vConfigMapActionsNames.updateImages]: (val: { [key: string]: string }) => ({
    type: v2vConfigMapActionsNames.updateImages,
    payload: val,
  }),
};
