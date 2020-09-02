export enum UIValidationType {
  LENGTH,
}

export type UIValidation = {
  type: UIValidationType;
  settings?: { min?: number; max?: number };
};
