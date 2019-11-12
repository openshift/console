import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import { RootState } from '@console/internal/redux';
import { stateToProps } from '@console/internal/reducers/features';
import { pluginStore } from '@console/internal/plugins';
import { getGatingFlagNames, isExtensionInUse } from './store';
import { Extension, ExtensionTypeGuard } from './typings';

/**
 * React higher-order component (HOC) for consuming Console extensions.
 *
 * This is semantically equivalent to `useExtensions` hook with one difference:
 * instead of using multiple HOCs for retrieving different extension types, you
 * may pass multiple type guards as arguments so that your component receives
 * all relevant extensions via single `extensions` prop.
 *
 * Example usage:
 *
 * ```ts
 * import { withExtensions, WithExtensionsProps, isNavItem, isPerspective } from '@console/plugin-sdk';
 *
 * const Example = withExtensions(isNavItem, isPerspective)(
 *   class Example extends React.Component<ExampleOwnProps & WithExtensionsProps> {
 *     render() {
 *       const navItems = this.props.extensions.filter(isNavItem);
 *       const perspectives = this.props.extensions.filter(isPerspective);
 *       // process extensions and render your component
 *     }
 *   },
 * );
 * ```
 *
 * @param typeGuards Type guard(s) used to narrow the extension type(s).
 */
export const withExtensions: WithExtensions = (...typeGuards) => {
  const allExtensions = pluginStore.getAllExtensions();

  // 1) Narrow extensions according to type guard(s)
  const matchedExtensions = _.flatMap(typeGuards.map((tg) => allExtensions.filter(tg)));

  // 2.a) Compute flags relevant for gating matched extensions
  const gatingFlagNames = getGatingFlagNames(matchedExtensions);

  return connect(
    (state: RootState) => {
      // 2.b) Compute flags relevant for gating matched extensions
      const gatingFlags = stateToProps(gatingFlagNames, state).flags;

      // 3) Gate matched extensions by relevant feature flags
      const extensionsInUse = matchedExtensions.filter((e) => isExtensionInUse(e, gatingFlags));

      return { extensions: extensionsInUse };
    },
    null,
    null,
    {
      areStatesEqual: ({ FLAGS: next }, { FLAGS: prev }) =>
        gatingFlagNames.every((f) => next.get(f) === prev.get(f)),
    },
  );
};

type WithExtensions = <E extends Extension, P extends WithExtensionsProps<E>>(
  ...typeGuards: ExtensionTypeGuard<E>[]
) => (
  C: React.ComponentType<P>,
) => React.ComponentType<Omit<P, keyof WithExtensionsProps<E>>> & {
  WrappedComponent: React.ComponentType<P>;
};

export type WithExtensionsProps<E extends Extension = Extension> = {
  extensions: readonly E[];
};
