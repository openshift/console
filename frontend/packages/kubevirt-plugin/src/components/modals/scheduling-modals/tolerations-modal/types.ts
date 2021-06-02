import { Toleration } from '@console/internal/module/k8s';
import { IDLabel } from '../../../LabelsList/types';

export type TolerationLabel = IDLabel & Toleration;
