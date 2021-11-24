import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import {
  ImportEnvironment,
  isImportEnvironment,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk';
import { InputField } from '@console/shared';

interface BuilderImageEnvironmentsProps {
  name: string;
  imageStreamName: string;
  imageStreamTag: string;
}

const BuilderImageEnvironments: React.FC<BuilderImageEnvironmentsProps> = ({
  name,
  imageStreamName,
  imageStreamTag,
}) => {
  const [environmentExtensions, resolved] = useResolvedExtensions<ImportEnvironment>(
    isImportEnvironment,
  );

  const filteredExtensions = React.useMemo(
    () =>
      environmentExtensions?.filter(
        (e) =>
          e.properties.imageStreamName === imageStreamName &&
          e.properties.imageStreamTags.includes(imageStreamTag),
      ),
    [environmentExtensions, imageStreamName, imageStreamTag],
  );

  if (!resolved) {
    return null;
  }
  return (
    <>
      {filteredExtensions.map(({ properties }) =>
        properties.environments.map((env) => (
          <InputField
            key={`${properties.imageStreamName}-${env.key}`}
            type={TextInputTypes.text}
            name={`${name}.${env.key}`}
            label={env.label}
            helpText={env.description}
            placeholder={env.defaultValue}
          />
        )),
      )}
    </>
  );
};

export default BuilderImageEnvironments;
