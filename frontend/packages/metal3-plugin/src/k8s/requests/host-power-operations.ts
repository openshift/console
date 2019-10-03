import { k8sPatch } from '@console/internal/module/k8s';
import { BareMetalHostModel } from '../../models';
import { BareMetalHostKind } from '../../types';

export const powerOffHost = (host: BareMetalHostKind) =>
  k8sPatch(BareMetalHostModel, host, [{ op: 'replace', path: '/spec/online', value: false }]);

export const powerOnHost = (host: BareMetalHostKind) =>
  k8sPatch(BareMetalHostModel, host, [{ op: 'replace', path: '/spec/online', value: true }]);
