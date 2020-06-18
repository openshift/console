import * as React from 'react';
import { SectionHeading, LoadingBox } from '../utils';
import { SyncMarkdownView } from '../markdown-view';
import {
  SampleRepoLink,
  DocumentationUrlLink,
  PlanItems,
  ImageStreamText,
  ExpandCollapseDescription,
} from './description-utils';
import { Plan } from './types';

type FullDescriptionProps = {
  tileDescription: string;
  documentationUrl: string;
  kind: string;
  longDescription: string;
  markdown: string;
  markdownLoading: boolean;
  plans: Plan[];
  sampleRepo: string;
};

export const FullDescription: React.FC<FullDescriptionProps> = ({
  tileDescription,
  markdownLoading,
  markdown,
  kind,
  plans,
  sampleRepo,
  longDescription,
  documentationUrl,
}) => {
  const description = (
    <>
      {longDescription && <p>{longDescription}</p>}
      <SampleRepoLink link={sampleRepo} />
      <DocumentationUrlLink link={documentationUrl} />
      <PlanItems plans={plans} />
    </>
  );
  return (
    <div className="co-catalog-page__overlay-description">
      <SectionHeading text="Description" />
      {tileDescription && <p>{tileDescription}</p>}
      {markdownLoading && <LoadingBox message="Loading Markdown..." />}
      {markdown ? (
        kind === 'InstalledOperator' ? (
          <ExpandCollapseDescription>
            <SyncMarkdownView content={markdown} />
            {description}
          </ExpandCollapseDescription>
        ) : (
          <>
            <SyncMarkdownView content={markdown} />
            {description}
          </>
        )
      ) : (
        description
      )}
      {kind === 'ImageStream' && <ImageStreamText />}
    </div>
  );
};
