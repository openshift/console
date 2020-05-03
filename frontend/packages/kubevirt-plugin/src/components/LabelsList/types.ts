import { IDEntity } from '../../types';
import { MatchExpression, TaintEffect } from '@console/internal/module/k8s';

export type IDLabel = IDEntity & {
  key: string;
  value?: string;
  values?: string[];
  operator?: MatchExpression['operator'];
  effect?: TaintEffect;
};
