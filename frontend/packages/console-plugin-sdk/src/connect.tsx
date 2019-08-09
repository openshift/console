import * as React from 'react';
import { connect } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { featureReducerName } from '@console/internal/reducers/features';
import { pluginStore } from '@console/internal/plugins';
import { Extension } from './typings';

/**
 * Returns a higher-order component (HOC) that connects the provided `Component`
 * to Console extensions. This is a direct analogy to `connect` from react-redux,
 * but using `Extension[]` as the source of truth.
 *
 * Use `mapExtensionsToProps` to specify additional props to pass to the wrapped
 * component, based on the extensions that are currently in use.
 *
 * An extension is in use when
 * - it is an always-on extension (i.e. not gated by any feature flags)
 * - otherwise, its `flags` constraints must be satisfied
 *   - all required feature flags are resolved to `true`
 *   - all disallowed feature flags are resolved to `false`
 */
export const connectToExtensions: ConnectToExtensions = (mapExtensionsToProps) => (Component) => {
  const mapStateToProps = (state: RootState) => ({
    allFlags: state[featureReducerName],
  });

  const ComponentWrapper = connect(mapStateToProps)(({ allFlags: flags, ...ownProps }) => {
    const extensions = pluginStore.getExtensionsInUse(flags);
    const extensionProps = mapExtensionsToProps(extensions, ownProps as any);
    return <Component {...ownProps} {...extensionProps} />;
  });

  const HOC = (props) => <ComponentWrapper {...props} />;
  HOC.displayName = `connectToExtensions(${Component.displayName || Component.name})`;
  HOC.WrappedComponent = Component;
  return HOC;
};

type ConnectToExtensions = <ExtensionProps = any, OwnProps = any>(
  mapExtensionsToProps: MapExtensionsToProps<ExtensionProps, OwnProps>,
) => (
  Component: React.ComponentType<ExtensionProps>,
) => React.ComponentType<OwnProps> & { WrappedComponent: React.ComponentType<ExtensionProps> };

type MapExtensionsToProps<ExtensionProps, OwnProps> = (
  extensions: Extension[],
  ownProps?: OwnProps,
) => ExtensionProps;
