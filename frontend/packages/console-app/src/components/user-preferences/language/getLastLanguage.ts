import { LAST_LANGUAGE_LOCAL_STORAGE_KEY } from './const';

export const getLastLanguage = (): string => localStorage.getItem(LAST_LANGUAGE_LOCAL_STORAGE_KEY);
