import * as React from 'react';
import {
  ImageEnvironment,
  ImportEnvironment,
  isImportEnvironment,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk';

export const useBuilderImageEnvironments = (
  imageStreamName: string,
  imageStreamTag: string,
): [ImageEnvironment[], boolean] => {
  const [environmentExtensions, resolved] = useResolvedExtensions<ImportEnvironment>(
    isImportEnvironment,
  );

  const filteredExtensions = React.useMemo(
    () =>
      resolved
        ? environmentExtensions
            .filter(
              (e) =>
                e.properties.imageStreamName === imageStreamName &&
                e.properties.imageStreamTags.includes(imageStreamTag),
            )
            .map((e) => e.properties.environments)
            .flat()
        : [],
    [environmentExtensions, imageStreamName, imageStreamTag, resolved],
  );

  return [filteredExtensions, resolved];
};
