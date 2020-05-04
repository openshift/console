import { VMIKind } from '../types/vm';
import { VMStatusBundle } from '../statuses/vm/types';

export interface VMNodeData {
  url: string;
  kind: string;
  vmi: VMIKind;
  vmStatusBundle: VMStatusBundle;
  osImage: string;
}
