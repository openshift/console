import * as React from 'react';
import {
  ContextProvider,
  isContextProvider,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk';
import useReduxReducerExtensions from '../../redux/useReduxReducerExtensions';
import { PageLoader } from '../loading';
import { DetectPerspective } from '../perspectives';
import AppRoutes from './AppRoutes';
import EnhancedProvider from './EnhancedProvider';
import PageFrame from './PageFrame';

const MainAppContent: React.FC = () => {
  const reduxExtensionsLoaded = useReduxReducerExtensions();
  const [contextProviderExtensions, contextProvidersLoaded] = useResolvedExtensions<
    ContextProvider
  >(isContextProvider);

  if (!reduxExtensionsLoaded || !contextProvidersLoaded) {
    return <PageLoader />;
  }

  const content = (
    <PageFrame>
      <AppRoutes />
    </PageFrame>
  );

  return (
    <DetectPerspective>
      {contextProviderExtensions.reduce(
        (children, e) => (
          <EnhancedProvider key={e.uid} contextProperties={e.properties}>
            {children}
          </EnhancedProvider>
        ),
        content,
      )}
    </DetectPerspective>
  );
};

export default MainAppContent;
