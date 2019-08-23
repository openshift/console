import * as _ from 'lodash';
import { NetworkAttachmentDefinitionConfig, NetworkAttachmentDefinitionKind } from '../types';

export const getConfig = (
  obj: NetworkAttachmentDefinitionKind,
): NetworkAttachmentDefinitionConfig => JSON.parse(_.get(obj, 'spec.config'));
