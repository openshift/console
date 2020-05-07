import * as Immutable from 'immutable';
import { SpecCapability } from '../types';
import {
  NodeAffinityField,
  PodAffinityField,
  ResourceRequirementsField,
  UpdateStrategyField,
  BooleanField,
} from '@console/shared/src/components/dynamic-form/fields';
import {
  CheckboxWidget,
  ImagePullPolicyWidget,
  NumberWidget,
  PasswordWidget,
  TextWidget,
  PodCountWidget,
  SelectWidget,
} from '@console/shared/src/components/dynamic-form/widgets';

export const capabilityFieldMap = Immutable.Map({
  [SpecCapability.nodeAffinity]: NodeAffinityField,
  [SpecCapability.podAffinity]: PodAffinityField,
  [SpecCapability.podAntiAffinity]: PodAffinityField,
  [SpecCapability.resourceRequirements]: ResourceRequirementsField,
  [SpecCapability.updateStrategy]: UpdateStrategyField,
  [SpecCapability.booleanSwitch]: BooleanField,
});

export const capabilityWidgetMap = Immutable.Map({
  [SpecCapability.hidden]: 'hidden',
  [SpecCapability.imagePullPolicy]: ImagePullPolicyWidget,
  [SpecCapability.checkbox]: CheckboxWidget,
  [SpecCapability.number]: NumberWidget,
  [SpecCapability.password]: PasswordWidget,
  [SpecCapability.podCount]: PodCountWidget,
  [SpecCapability.text]: TextWidget,
  [SpecCapability.select]: SelectWidget,
});
