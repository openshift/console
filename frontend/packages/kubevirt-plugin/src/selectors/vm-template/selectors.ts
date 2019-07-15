import * as _ from 'lodash';
import { TemplateKind } from '@console/internal/module/k8s';
import { VirtualMachineModel } from '../../models';
import { VMKind } from '../../types';

export const selectVM = (vmTemplate: TemplateKind): VMKind =>
  _.get(vmTemplate, 'objects', []).find((obj) => obj.kind === VirtualMachineModel.kind);
