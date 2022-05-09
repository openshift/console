import * as React from 'react';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import { resolveExtension } from '../coderefs/coderef-resolver';
import { UseResolvedExtensions } from '../extensions/console-types';
import { Extension, ExtensionTypeGuard, ResolvedExtension } from '../types';
import { settleAllPromises } from '../utils/promise';

export const useResolvedExtensions: UseResolvedExtensions = <E extends Extension>(
  ...typeGuards: ExtensionTypeGuard<E>[]
): [ResolvedExtension<E>[], boolean, any[]] => {
  const extensions = useExtensions<E>(...typeGuards);

  const [resolvedExtensions, setResolvedExtensions] = React.useState<ResolvedExtension<E>[]>([]);
  const [resolved, setResolved] = React.useState<boolean>(false);
  const [errors, setErrors] = React.useState<any[]>([]);

  React.useEffect(() => {
    let disposed = false;

    // eslint-disable-next-line promise/catch-or-return
    settleAllPromises(
      extensions.map((e) => resolveExtension<typeof e, any, ResolvedExtension<E>>(e)),
    ).then(([fulfilledValues, rejectedReasons]) => {
      if (!disposed) {
        setResolvedExtensions(fulfilledValues);
        setErrors(rejectedReasons);
        setResolved(true);

        if (rejectedReasons.length > 0) {
          // eslint-disable-next-line no-console
          console.error('Detected errors while resolving Console extensions', rejectedReasons);
        }
      }
    });

    return () => {
      disposed = true;
    };
  }, [extensions]);

  return [resolvedExtensions, resolved, errors];
};
