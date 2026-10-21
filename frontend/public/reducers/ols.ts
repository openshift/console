import type { RootState } from '../redux';

export enum ActionType {
  OpenOLS = 'openOLS',
  CloseOLS = 'closeOLS',
}

type CodeBlock = {
  id: string;
  value: string;
  triggeredFrom?: any;
};

/* Note: Using Reducer and Selector from OLS plugin */
export const getOLSCodeBlock = ({ plugins }: RootState): CodeBlock =>
  plugins?.ols?.get('codeBlock');
