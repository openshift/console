import { ImportProvidersSettings } from '../redux/initial-state/types';
import { ImportProvidersField } from '../types';

export const getImportProvidersFieldValue = (
  importProvidersSettings: ImportProvidersSettings,
  key: ImportProvidersField,
) =>
  importProvidersSettings &&
  importProvidersSettings[key] &&
  (importProvidersSettings[key] as any).value;
