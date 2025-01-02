declare interface Window {
  SERVER_FLAGS: {
    basePath: string;
  };
  /** (OCPBUGS-46415) Do not override this string! To add new errors please append to windowError if it exists*/
  windowError?: string;
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: Function;
}
