import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import { RootState } from '@console/internal/redux';
import { stateToFlagsObject } from '@console/internal/reducers/features';
import { pluginStore } from '@console/internal/plugins';
import { getGatingFlagNames, isExtensionInUse } from './store';
import { Extension, ExtensionTypeGuard, LoadedExtension } from './typings';

/**
 * React higher-order component (HOC) for consuming Console extensions.
 *
 * This is semantically equivalent to `useExtensions` hook with one difference:
 * this HOC supports retrieving different extension types and providing them to
 * your component as props.
 *
 * Example usage:
 *
 * ```ts
 * import {
 *   withExtensions,
 *   NavItem,
 *   Perspective,
 *   isNavItem,
 *   isPerspective,
 * } from '@console/plugin-sdk';
 *
 * const Example = withExtensions<ExampleExtensionProps>({
 *   navItemExtensions: isNavItem,
 *   perspectiveExtensions: isPerspective,
 * })(
 *   class Example extends React.Component<ExampleOwnProps & ExampleExtensionProps> {
 *     render() {
 *       const { navItemExtensions, perspectiveExtensions } = this.props;
 *       // process extensions and render your component
 *     }
 *   },
 * );
 *
 * type ExampleExtensionProps = {
 *   navItemExtensions: NavItem[];
 *   perspectiveExtensions: Perspective[];
 * };
 * ```
 *
 * @param typeGuardMapper Object that maps prop names to extension type guards.
 * It's basically an object-based analogy to Redux `mapStateToProps` function.
 */
export const withExtensions = <
  TExtensionProps extends ExtensionProps<E>,
  E extends Extension = Extension
>(
  typeGuardMapper: ExtensionTypeGuardMapper<E, TExtensionProps>,
): (<P extends TExtensionProps>(
  C: React.ComponentType<P>,
) => React.ComponentType<Omit<P, keyof TExtensionProps>> & {
  WrappedComponent: React.ComponentType<P>;
}) => {
  const allExtensions = pluginStore.getAllExtensions();

  // 1) Narrow extensions according to type guards
  const matchedExtensions = _.flatMap(
    Object.values(typeGuardMapper).map((tg) => allExtensions.filter(tg)),
  );

  // 2.a) Compute flags relevant for gating matched extensions
  const gatingFlagNames = getGatingFlagNames(matchedExtensions);

  return connect<TExtensionProps, any, any, RootState>(
    (state) => {
      // 2.b) Compute flags relevant for gating matched extensions
      const gatingFlags = stateToFlagsObject(state.FLAGS, gatingFlagNames);

      // 3) Gate matched extensions by relevant feature flags
      const extensionsInUse = matchedExtensions.filter((e) => isExtensionInUse(e, gatingFlags));

      return Object.keys(typeGuardMapper).reduce(
        (props, propName) => ({
          ...props,
          [propName]: extensionsInUse.filter(typeGuardMapper[propName]),
        }),
        {},
      ) as TExtensionProps;
    },
    null,
    null,
    {
      areStatesEqual: ({ FLAGS: next }, { FLAGS: prev }) =>
        gatingFlagNames.every((f) => next.get(f) === prev.get(f)),
    },
  );
};

type ExtensionProps<E extends Extension> = {
  [propName: string]: E[] | LoadedExtension<E>[];
};

type ExtensionTypeGuardMapper<E extends Extension, P extends ExtensionProps<E>> = {
  [K in keyof P]: ExtensionTypeGuard<E>;
};
