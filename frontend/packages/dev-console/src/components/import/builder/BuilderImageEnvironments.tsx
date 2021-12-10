import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import { InputField } from '@console/shared';
import { useBuilderImageEnvironments } from './builderImageHooks';

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
  const {
    values: {
      build: { env: buildEnvs },
      image: { imageEnv },
      formType,
    },
    setFieldValue,
  } = useFormikContext<FormikValues>();

  const [environments, loaded] = useBuilderImageEnvironments(imageStreamName, imageStreamTag);

  React.useEffect(() => {
    if (formType === 'edit' && buildEnvs?.length > 0 && !imageEnv) {
      environments.forEach((env) =>
        buildEnvs.forEach((buildEnv) => {
          if (buildEnv.name === env.key) {
            setFieldValue(`${name}.${env.key}`, buildEnv.value);
          }
        }),
      );
    }
  }, [buildEnvs, formType, imageEnv, setFieldValue, environments, name]);

  if (!loaded) {
    return null;
  }
  return (
    <>
      {environments.map((env) => (
        <InputField
          key={`${imageStreamName}-${env.key}`}
          type={TextInputTypes.text}
          name={`${name}.${env.key}`}
          label={env.label}
          helpText={env.description}
          placeholder={env.defaultValue}
        />
      ))}
    </>
  );
};

export default BuilderImageEnvironments;
