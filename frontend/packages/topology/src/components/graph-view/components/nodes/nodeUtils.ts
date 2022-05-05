import { get } from 'lodash';
import { kindToAbbr, modelFor } from '@console/internal/module/k8s';

export const getKindStringAndAbbreviation = (
  kind: string,
): { kindStr: string; kindAbbr: string; kindColor: string } => {
  const kindObj = modelFor(kind);
  const kindStr = get(kindObj, 'kind', kind);
  const kindColor = get(kindObj, 'color', undefined);
  const kindAbbr = (kindObj && kindObj.abbr) || kindToAbbr(kindStr);
  return { kindStr, kindAbbr, kindColor };
};
