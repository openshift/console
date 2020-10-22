import * as React from 'react';
import * as hoistStatics from 'hoist-non-react-statics';
import { useExtensions } from './useExtensions';
import { Extension, ExtensionTypeGuard, LoadedExtension } from '../typings';

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
 *
 * @returns `withExtensions` higher-order component creator function.
 */
export const withExtensions = <
  TExtensionProps extends ExtensionProps<E>,
  E extends Extension = Extension,
  TCombinedProps extends TExtensionProps = TExtensionProps
>(
  typeGuardMapper: ExtensionTypeGuardMapper<E, TExtensionProps>,
): ((C: React.ComponentType<TCombinedProps>) => ExtensionHOC<TCombinedProps, TExtensionProps>) => (
  WrappedComponent,
) => {
  const typeGuards = Object.values(typeGuardMapper);

  if (typeGuards.length === 0) {
    throw new Error('The object passed to withExtensions must contain at least one type guard');
  }

  const HOC: ExtensionHOC<TCombinedProps, TExtensionProps> = (props) => {
    const extensionsInUse = useExtensions(...typeGuards);

    const extensionProps = React.useMemo(
      () =>
        Object.keys(typeGuardMapper).reduce((acc, propName) => {
          acc[propName] = extensionsInUse.filter(typeGuardMapper[propName]);
          return acc;
        }, {} as ExtensionProps<E>),
      [extensionsInUse],
    );

    const combinedProps = {
      ...props,
      ...extensionProps,
    } as TCombinedProps;

    return <WrappedComponent {...combinedProps} />;
  };

  HOC.displayName = `withExtensions(${WrappedComponent.displayName || WrappedComponent.name})`;
  HOC.WrappedComponent = WrappedComponent;

  return hoistStatics(HOC, WrappedComponent);
};

type ExtensionHOC<TCombinedProps, TExtensionProps> = React.ComponentType<
  Omit<TCombinedProps, keyof TExtensionProps>
> & {
  WrappedComponent: React.ComponentType<TCombinedProps>;
};

type ExtensionProps<E extends Extension> = {
  [propName: string]: E[] | LoadedExtension<E>[];
};

type ExtensionTypeGuardMapper<E extends Extension, P extends ExtensionProps<E>> = {
  [K in keyof P]: ExtensionTypeGuard<E>;
};
