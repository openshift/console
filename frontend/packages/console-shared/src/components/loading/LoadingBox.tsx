import type { FC, ReactNode } from 'react';
import { useEffect, useId } from 'react';
import { ConsoleEmptyState } from '../empty-state/ConsoleEmptyState';
import { Loading } from './Loading';

// Enables critical rendering path (CRP) blame mode, which helps with debugging
// performance issues related to the loading state. Adds extra profiling information
// to the browser devtools Performance tab, and shows the loading component's `blame`
// prop as the title of the loading box.
const IS_BLAME_ENABLED = new URLSearchParams(window.location.search).has('crp-blame');

interface LoadingBoxProps {
  /**
   * The name of the component or feature that is loading. Will be
   * shown only if the `crp-blame` query param is set. No i18n is
   * needed as this is for debugging purposes only.
   */
  blame?: string;
  children?: ReactNode;
}

export const LoadingBox: FC<LoadingBoxProps> = ({ blame = 'LoadingBox', children }) => {
  const id = useId();

  useEffect(() => {
    if (!IS_BLAME_ENABLED) {
      return undefined;
    }
    const markName = `LoadingBox:${blame}:${id}`;
    performance.mark(`${markName}:start`);
    return () => {
      performance.mark(`${markName}:end`);
      performance.measure(markName, `${markName}:start`, `${markName}:end`);
    };
  }, [blame, id]);

  return (
    <ConsoleEmptyState
      data-test="loading-box"
      isFullHeight
      title={IS_BLAME_ENABLED ? blame : undefined}
    >
      <Loading />
      {children}
    </ConsoleEmptyState>
  );
};
LoadingBox.displayName = 'LoadingBox';
