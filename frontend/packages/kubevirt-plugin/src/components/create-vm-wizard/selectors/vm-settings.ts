import * as _ from 'lodash';
import { VMSettings } from '../redux/initial-state/types';
import { VMSettingsField } from '../types';

export const getFieldValue = (vmSettings: VMSettings, key: VMSettingsField) =>
  vmSettings && vmSettings[key] && vmSettings[key].value;

type SimpleSettings = { [key in VMSettingsField]: any };

export const asSimpleSettings = (vmSettings: VMSettings): SimpleSettings =>
  Object.keys(vmSettings).reduce((accumulator, key) => {
    if (_.has(vmSettings[key], 'value')) {
      accumulator[key] = vmSettings[key].value;
    }
    return accumulator;
  }, {} as any);
