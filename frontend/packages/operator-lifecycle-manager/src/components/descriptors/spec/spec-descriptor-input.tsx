import * as Immutable from 'immutable';
import {
  NodeAffinityField,
  PodAffinityField,
  ResourceRequirementsField,
  UpdateStrategyField,
} from '@console/shared/src/components/dynamic-form/fields';
import {
  CheckboxWidget,
  ImagePullPolicyWidget,
  NumberWidget,
  PasswordWidget,
  SwitchWidget,
  TextWidget,
  PodCountWidget,
  SelectWidget,
} from '@console/shared/src/components/dynamic-form/widgets';
import { SpecCapability } from '../types';

export const capabilityFieldMap = Immutable.Map({
  [SpecCapability.nodeAffinity]: NodeAffinityField,
  [SpecCapability.podAffinity]: PodAffinityField,
  [SpecCapability.podAntiAffinity]: PodAffinityField,
  [SpecCapability.resourceRequirements]: ResourceRequirementsField,
  [SpecCapability.updateStrategy]: UpdateStrategyField,
});

export const capabilityWidgetMap = Immutable.Map({
  [SpecCapability.hidden]: 'hidden',
  [SpecCapability.imagePullPolicy]: ImagePullPolicyWidget,
  [SpecCapability.booleanSwitch]: SwitchWidget,
  [SpecCapability.checkbox]: CheckboxWidget,
  [SpecCapability.number]: NumberWidget,
  [SpecCapability.password]: PasswordWidget,
  [SpecCapability.podCount]: PodCountWidget,
  [SpecCapability.text]: TextWidget,
  [SpecCapability.select]: SelectWidget,
});
