import { MatchExpression, TaintEffect } from '@console/internal/module/k8s';
import { IDEntity } from '../../types';

export type IDLabel = IDEntity & {
  key: string;
  value?: string;
  values?: string[];
  operator?: MatchExpression['operator'];
  effect?: TaintEffect;
};
