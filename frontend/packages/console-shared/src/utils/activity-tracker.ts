const LAST_CONSOLE_ACTIVITY_TIMESTAMP_LOCAL_STORAGE_KEY = 'last-console-activity-timestamp';

export const updateLastConsoleActivity = (): void => {
  try {
    localStorage.setItem(LAST_CONSOLE_ACTIVITY_TIMESTAMP_LOCAL_STORAGE_KEY, Date.now().toString());
    window.dispatchEvent(new CustomEvent('console-activity'));
  } catch (e) {
    // localStorage may be full or blocked; don't break the caller
  }
};
