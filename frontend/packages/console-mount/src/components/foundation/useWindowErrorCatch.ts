const useWindowErrorCatch = () => {
  // Used by GUI tests to check for unhandled exceptions
  window.windowError = null;
  window.onerror = (message, source, lineno, colno, error) => {
    const { stack } = error;
    const formattedStack = stack?.replace(/\\n/g, '\n');
    window.windowError = `unhandled error: ${message} ${formattedStack || ''}`;
    // eslint-disable-next-line no-console
    console.error(window.windowError);
  };
  window.onunhandledrejection = (promiseRejectionEvent) => {
    const { reason } = promiseRejectionEvent;
    window.windowError = `unhandled promise rejection: ${reason}`;
    // eslint-disable-next-line no-console
    console.error(window.windowError);
  };
};

export default useWindowErrorCatch;
