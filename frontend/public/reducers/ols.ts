import { RootState } from '../redux';

export enum ActionType {
  OpenOLS = 'openOLS',
  CloseOLS = 'closeOLS',
}

type CodeBlock = {
  id: string;
  value: string;
};

export const getOLSCodeBlock = ({ plugins }: RootState): CodeBlock =>
  plugins?.ols?.get('codeBlock');
