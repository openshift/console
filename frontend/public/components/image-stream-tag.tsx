import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom-v5-compat';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';

import PaneBody from '@console/shared/src/components/layout/PaneBody';
import PaneBodyGroup from '@console/shared/src/components/layout/PaneBodyGroup';
import { K8sResourceKind, K8sResourceKindReference } from '../module/k8s';
import { DetailsPage } from './factory/details';
import { SectionHeading } from './utils/headings';
import { navFactory } from './utils/horizontal-nav';
import { ResourceSummary } from './utils/details-page';
import { humanizeBinaryBytes } from './utils/units';
import { resourcePath } from './utils/resource-link';
import { ExampleDockerCommandPopover } from './image-stream';
import { ImageStreamTimeline } from './image-stream-timeline';
import { getBreadcrumbPath } from '@console/internal/components/utils/breadcrumbs';

const ImageStreamTagsReference: K8sResourceKindReference = 'ImageStreamTag';
const ImageStreamsReference: K8sResourceKindReference = 'ImageStream';

// Splits a name/value pair separated by an `=`
const splitEnv = (nameValue: string) => {
  // Use this method instead of `String.split()` so we only split on the first `=`.
  const i = nameValue.indexOf('=');
  if (i === -1) {
    return {
      name: nameValue,
      value: '',
    };
  }

  return {
    name: nameValue.substring(0, i),
    value: nameValue.substring(i + 1),
  };
};

export const SupportedPlatformsTable = (props) => {
  const { t } = useTranslation();
  const { submanifests, policy, heading } = props;

  if (!policy || submanifests.length === 0) {
    // If the policy does not support Manifest Lists, it exits.
    // or the Manifest List is empty
    return null;
  }

  return (
    <>
      {heading && <SectionHeading text={heading} />}
      <div className="co-table-container">
        <Table variant="compact" borders gridBreakPoint="">
          <Thead>
            <Tr>
              <Th modifier="nowrap">{t('public~OS')}</Th>
              <Th modifier="nowrap">{t('public~Architecture')}</Th>
              <Th modifier="nowrap">{t('public~Identifier')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {submanifests.map((submanifest, index) => (
              <Tr key={index}>
                <Td>{submanifest.os}</Td>
                <Td>{submanifest.architecture}</Td>
                <Td>{submanifest.digest}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>
    </>
  );
};

SupportedPlatformsTable.displayName = 'SupportedPlatformsTable';

export const ImageStreamTagsDetails: Snail.FCC<ImageStreamTagsDetailsProps> = ({
  obj: imageStreamTag,
  imageStream,
}) => {
  const config = _.get(imageStreamTag, 'image.dockerImageMetadata.Config', {});
  const labels = config.Labels || {};
  // Convert to an array of objects with name and value properties, then sort the array for display.
  const labelsArray = _.map(labels, (value, name) => ({ name, value }));
  const sortedLabels = _.sortBy(labelsArray, 'name');

  // Sort the submanifests by os,architecture
  const submanifests = _.get(imageStreamTag, 'image.dockerImageManifests', {});
  const sortedSubmanifests = _.sortBy(submanifests, ['os', 'architecture']);
  const importPolicyPreserveOriginal =
    _.get(imageStreamTag, 'tag.importPolicy.importMode', {}) === 'PreserveOriginal';

  const entrypoint = (config.Entrypoint || []).join(' ');
  const cmd = (config.Cmd || []).join(' ');
  const exposedPorts = _.keys(config.ExposedPorts).join(', ');
  const size = _.get(imageStreamTag, 'image.dockerImageMetadata.Size');
  const humanizedSize = _.isFinite(size) && humanizeBinaryBytes(size).string;
  const architecture = _.get(imageStreamTag, 'image.dockerImageMetadata.Architecture');
  const tagName = _.get(imageStreamTag, 'tag.name');

  const { t } = useTranslation();

  return (
    <PaneBody>
      <PaneBodyGroup>
        <Grid hasGutter>
          <GridItem md={6}>
            <SectionHeading text={t('public~ImageStreamTag details')} />
            <ResourceSummary resource={imageStreamTag}>
              {labels.name && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('public~Image name')}</DescriptionListTerm>
                  <DescriptionListDescription>{labels.name}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {labels.summary && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('public~Summary')}</DescriptionListTerm>
                  <DescriptionListDescription>{labels.summary}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {humanizedSize && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('public~Size')}</DescriptionListTerm>
                  <DescriptionListDescription>{humanizedSize}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
            </ResourceSummary>
            <ExampleDockerCommandPopover imageStream={imageStream} tag={tagName} />
          </GridItem>
          <GridItem md={6}>
            <SectionHeading text={t('public~Configuration')} />
            <DescriptionList>
              {entrypoint && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('public~Entrypoint')}</DescriptionListTerm>
                  <DescriptionListDescription className="co-break-word">
                    {entrypoint}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {cmd && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('public~Command')}</DescriptionListTerm>{' '}
                  <DescriptionListDescription className="co-break-word">
                    {cmd}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {config.WorkingDir && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('public~Working dir')}</DescriptionListTerm>{' '}
                  <DescriptionListDescription className="co-break-all">
                    {config.WorkingDir}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {exposedPorts && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('public~Exposed ports')}</DescriptionListTerm>
                  <DescriptionListDescription className="co-break-word">
                    {exposedPorts}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {config.User && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('public~User')}</DescriptionListTerm>ser &&{' '}
                  <DescriptionListDescription>{config.User}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {architecture && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('public~Architecture')}</DescriptionListTerm>
                  <DescriptionListDescription>{architecture}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
            </DescriptionList>
          </GridItem>
        </Grid>
      </PaneBodyGroup>
      <PaneBodyGroup>
        <SectionHeading text={t('public~Image labels')} />
        {_.isEmpty(sortedLabels) ? (
          <span className="pf-v6-u-text-color-subtle">{t('public~No labels')}</span>
        ) : (
          <div className="co-table-container">
            <Table variant="compact" borders gridBreakPoint="">
              <Thead>
                <Tr>
                  <Th>{t('public~Name')}</Th>
                  <Th>{t('public~Value')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {_.map(sortedLabels, ({ name, value }) => (
                  <Tr key={name}>
                    <Td>{name}</Td>
                    <Td>{value}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        )}
      </PaneBodyGroup>
      <PaneBodyGroup>
        <SectionHeading text={t('public~Environment variables')} />
        {_.isEmpty(config.Env) ? (
          <span className="pf-v6-u-text-color-subtle">{t('public~No environment variables')}</span>
        ) : (
          <div className="co-table-container">
            <Table variant="compact" borders gridBreakPoint="">
              <Thead>
                <Tr>
                  <Th>{t('public~Name')}</Th>
                  <Th>{t('public~Value')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {_.map(config.Env, (nameValueStr, i) => {
                  const pair = splitEnv(nameValueStr);
                  return (
                    <Tr key={i}>
                      <Td>{pair.name}</Td>
                      <Td>{pair.value}</Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </div>
        )}
      </PaneBodyGroup>
      <SupportedPlatformsTable
        submanifests={sortedSubmanifests}
        policy={importPolicyPreserveOriginal}
        heading={t('public~Supported Platforms')}
      />
    </PaneBody>
  );
};

const parseName = (nameAndTag: string): string => {
  return nameAndTag.split(':')[0];
};

const getImageStreamNameAndTag = (imageStreamTag: K8sResourceKind) => {
  const imageStreamTagName: string = _.get(imageStreamTag, 'metadata.name') || '';
  const [imageStreamName, tag] = imageStreamTagName.split(':');
  return { imageStreamName, tag };
};

const ImageStreamTagHistory: Snail.FCC<ImageStreamTagHistoryProps> = ({
  obj: imageStreamTag,
  imageStream,
}) => {
  const { tag } = getImageStreamNameAndTag(imageStreamTag);
  const imageStreamStatusTags = _.filter(_.get(imageStream, 'status.tags'), (i) => i.tag === tag);
  return (
    <ImageStreamTimeline
      imageStreamTags={imageStreamStatusTags}
      imageStreamName={imageStream.metadata.name}
      imageStreamNamespace={imageStream.metadata.namespace}
    />
  );
};
ImageStreamTagHistory.displayName = 'ImageStreamTagHistory';

const pages = [
  navFactory.details(ImageStreamTagsDetails),
  navFactory.editYaml(),
  navFactory.history(ImageStreamTagHistory),
];
export const ImageStreamTagsDetailsPage: Snail.FCC<ImageStreamTagsDetailsPageProps> = (props) => {
  const { t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  return (
    <DetailsPage
      {...props}
      breadcrumbsFor={(obj) => {
        const { imageStreamName } = getImageStreamNameAndTag(obj);
        return [
          {
            name: t('public~ImageStreams'),
            path: getBreadcrumbPath(params, 'imagestreams'),
          },
          {
            name: imageStreamName,
            path: resourcePath('ImageStream', imageStreamName, params.ns),
          },
          {
            name: t('public~ImageStreamTag details'),
            path: location.pathname,
          },
        ];
      }}
      kind={ImageStreamTagsReference}
      resources={[
        {
          kind: ImageStreamsReference,
          name: parseName(props.name),
          namespace: props.namespace,
          isList: false,
          prop: 'imageStream',
        },
      ]}
      pages={pages}
    />
  );
};
ImageStreamTagsDetailsPage.displayName = 'ImageStreamTagsDetailsPage';

type ImageStreamTagHistoryProps = {
  imageStream: K8sResourceKind;
  obj: K8sResourceKind;
};

export type ImageStreamTagsDetailsProps = {
  obj: K8sResourceKind;
  imageStream: K8sResourceKind;
};

export type ImageStreamTagsDetailsPageProps = {
  namespace: string;
  name: string;
};

export type RowSupportedPlatformData = {
  os: string;
  architecture: string;
  digest: string;
};
