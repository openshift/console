import {
  Alert,
  AlertGroup,
  Card,
  CardBody,
  CardTitle,
  Gallery,
  GalleryItem,
  Hint,
  HintBody,
  HintTitle,
  Page,
  PageSection,
  Stack,
  Title,
} from '@patternfly/react-core';
import * as React from 'react';

export const ExamplePage: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="fix-ocp-pf">
      <Page
        additionalGroupedContent={
          <PageSection variant="light">
            <Title headingLevel="h1">{title}</Title>
          </PageSection>
        }
        groupProps={{ sticky: 'top' }}
      >
        <PageSection>
          <Stack hasGutter>
            <AlertGroup>
              <Alert title="Example info alert" variant="info" isInline />
              <Alert title="Example warning alert" variant="warning" isInline />
            </AlertGroup>
            <Hint>
              <HintTitle>Example hint</HintTitle>
              <HintBody>This page shows an example gallery view with cards</HintBody>
            </Hint>
            <Gallery hasGutter>
              {new Array(50).fill(0).map((_, index) => (
                <GalleryItem key={index}>
                  <Card>
                    <CardTitle>Example card</CardTitle>
                    <CardBody>Card content goes here.</CardBody>
                  </Card>
                </GalleryItem>
              ))}
            </Gallery>
          </Stack>
        </PageSection>
      </Page>
    </div>
  );
};

export default ExamplePage;
