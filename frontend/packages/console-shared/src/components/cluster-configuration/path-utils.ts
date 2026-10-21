/**
 * Extracts a values based on a path like value from `{ a: b: value } }` for the path `/a/b/`
 */
export const extractValue = <T>(value: any, path: string, separator = '/'): T => {
  let result = value;
  path.split(separator).forEach((part) => {
    if (part) {
      if (result?.hasOwnProperty(part)) {
        result = result[part];
      } else {
        result = null;
      }
    }
  });
  return result;
};

/**
 * Creates an object like `{ a: { b: value } }` for the path `/a/b/`.
 */
export const wrapValue = <T>(value: any, path: string, separator = '/'): T => {
  let result = value;
  path
    .split(separator)
    .reverse()
    .forEach((part) => {
      if (part) {
        result = { [part]: result };
      }
    });
  return result;
};
