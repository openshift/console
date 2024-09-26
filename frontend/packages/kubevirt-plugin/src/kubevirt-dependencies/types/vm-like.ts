import { TemplateKind } from '@console/internal/module/k8s';
import { VMKind } from './vm';
import { VMIKind } from './vmi';

export type VMILikeEntityKind = VMKind | VMIKind;
export type VMLikeEntityKind = VMKind | TemplateKind;
export type VMGenericLikeEntityKind = VMLikeEntityKind | VMILikeEntityKind;
