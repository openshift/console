import { Map as ImmutableMap } from 'immutable';
import { safeDump } from 'js-yaml';
import * as _ from 'lodash';
import { PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { ResultContentType } from '../../../k8s/enhancedK8sMethods/types';
import { DataSourceKind } from '../../../types/vm/index';
import { iGetName, iGetNamespace } from '../selectors/immutable/selectors';
import { VMSettingsField } from '../types';

export const VM_SETTINGS_METADATA_ID = 'VM_SETTINGS_METADATA_ID';
export const IMPORT_PROVIDES_METADATA_ID = 'IMPORT_PROVIDES_METADATA_ID';

export const asRequired = (value: any, key: string = VM_SETTINGS_METADATA_ID) => ({
  [key]: !!value,
});
export const asHidden = (value: any, key: string = VM_SETTINGS_METADATA_ID) => ({ [key]: !!value });
export const asDisabled = (value: any, key: string = VM_SETTINGS_METADATA_ID) => ({
  [key]: !!value,
});

export const nullOnEmptyChange = (
  onChange: (k: VMSettingsField, v: string) => void,
  fieldKey: VMSettingsField,
) => (v) => onChange(fieldKey, v === '' ? null : v);

export const resultContentToString = (data, type: ResultContentType) => {
  switch (type) {
    case ResultContentType.YAML:
      try {
        return safeDump(data);
      } catch (ignored) {} // eslint-disable-line no-empty
    case ResultContentType.JSON: // eslint-disable-line no-fallthrough
      return JSON.stringify(data, null, 1);
    case ResultContentType.Other:
    default:
      return _.toString(data);
  }
};

export const findDataSourcePVC = (
  dataSources: ImmutableMap<string, DataSourceKind>[],
  pvcs: ImmutableMap<string, PersistentVolumeClaimKind>[],
  dataSourceName: string,
  dataSourceNamespace: string,
) => {
  const dataSource = dataSources
    ?.find((iDS) => iGetName(iDS) === dataSourceName && iGetNamespace(iDS) === dataSourceNamespace)
    ?.toJS();
  const dsBaseImage = pvcs?.find(
    (iPVC) =>
      iGetName(iPVC) === dataSource?.spec?.source?.pvc?.name &&
      iGetNamespace(iPVC) === dataSource?.spec?.source?.pvc?.namespace,
  );
  return dsBaseImage;
};
