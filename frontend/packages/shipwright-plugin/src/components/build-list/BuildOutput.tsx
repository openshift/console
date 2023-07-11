import * as React from 'react';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/lib-core';
import { ExternalLinkWithCopy, ResourceLink } from '@console/internal/components/utils';
import { ImageStreamModel } from '@console/internal/models';
import { BUILD_OUTPUT_IMAGESTREAM_URL, BUILD_OUTPUT_QUAY_URL } from '../../const';
import { BuildSpec } from '../../types';

type BuildOutputProps = {
  buildSpec: BuildSpec;
};

const BuildOutput: React.FC<BuildOutputProps> = ({ buildSpec }) => {
  const outputImage = buildSpec?.output?.image;

  if (outputImage?.startsWith(BUILD_OUTPUT_IMAGESTREAM_URL)) {
    const imageStreamName = outputImage?.split('/')?.pop();
    const imageStreamNamespace = outputImage?.split('/')[1];
    return (
      <ResourceLink
        name={imageStreamName}
        namespace={imageStreamNamespace}
        groupVersionKind={getGroupVersionKindForModel(ImageStreamModel)}
      />
    );
  }
  if (outputImage?.startsWith(BUILD_OUTPUT_QUAY_URL)) {
    const outputImageName = outputImage?.split('/')?.slice(1)?.join('/');
    return <ExternalLinkWithCopy link={`https://${outputImage}`} text={outputImageName} />;
  }
  return <>{outputImage}</>;
};

export default BuildOutput;
