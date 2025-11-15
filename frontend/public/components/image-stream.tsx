import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import * as _ from 'lodash-es';
import * as semver from 'semver';
import { Table as PfTable, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import {
  AlertVariant,
  Button,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
  Popover,
} from '@patternfly/react-core';
import { QuestionCircleIcon } from '@patternfly/react-icons/dist/esm/icons/question-circle-icon';

import PaneBody from '@console/shared/src/components/layout/PaneBody';
import {
  K8sResourceKind,
  K8sResourceKindReference,
  referenceForModel,
  TableColumn,
} from '../module/k8s';
import { DetailsPage } from './factory/details';
import { ListPage } from './factory/list-page';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  initialFiltersDefault,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';

import { ImageStreamModel } from '../models';
import { DOC_URL_PODMAN } from './utils/documentation';
import { CopyToClipboard } from './utils/copy-to-clipboard';
import { ExpandableAlert } from './utils/alerts';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { Kebab, ResourceKebab } from './utils/kebab';
import { SectionHeading } from './utils/headings';
import { LabelList } from './utils/label-list';
import { navFactory } from './utils/horizontal-nav';
import { ResourceLink } from './utils/resource-link';
import { ResourceSummary } from './utils/details-page';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ImageStreamTimeline, getImageStreamTagName } from './image-stream-timeline';
import { YellowExclamationTriangleIcon } from '@console/shared/src/components/status/icons';
import { LoadingBox } from './utils/status-box';

const ImageStreamsReference: K8sResourceKindReference = 'ImageStream';
const ImageStreamTagsReference: K8sResourceKindReference = 'ImageStreamTag';
const kind = referenceForModel(ImageStreamModel);

export const getAnnotationTags = (specTag: any) =>
  _.get(specTag, 'annotations.tags', '').split(/\s*,\s*/);

const isBuilderTag = (specTag: any) => {
  // A spec tag has annotations tags, which is a comma-delimited string (e.g., 'builder,httpd').
  const annotationTags = getAnnotationTags(specTag);
  return _.includes(annotationTags, 'builder') && !_.includes(annotationTags, 'hidden');
};

const getStatusTags = (imageStream: K8sResourceKind): any => {
  const statusTags = _.get(imageStream, 'status.tags');
  return _.keyBy(statusTags, 'tag');
};

export const getBuilderTags = (imageStream: K8sResourceKind): any[] => {
  const statusTags = getStatusTags(imageStream);
  return _.filter(imageStream.spec.tags, (tag) => isBuilderTag(tag) && statusTags[tag.name]);
};

// Sort tags in reverse order by semver, falling back to a string comparison if not a valid version.
export const getBuilderTagsSortedByVersion = (imageStream: K8sResourceKind): any[] => {
  return getBuilderTags(imageStream).sort(({ name: a }, { name: b }) => {
    const v1 = semver.coerce(a);
    const v2 = semver.coerce(b);
    if (!v1 && !v2) {
      return a.localeCompare(b);
    }
    if (!v1) {
      return 1;
    }
    if (!v2) {
      return -1;
    }
    return semver.rcompare(v1, v2);
  });
};

export const getMostRecentBuilderTag = (imageStream: K8sResourceKind) => {
  const tags = getBuilderTagsSortedByVersion(imageStream);
  return _.head(tags);
};

// An image stream is a builder image if
// - It has a spec tag annotated with `builder` and not `hidden`
// - It has a corresponding status tag
export const isBuilder = (imageStream: K8sResourceKind) => !_.isEmpty(getBuilderTags(imageStream));

const { common } = Kebab.factory;
const menuActions = [...common];

const ImageStreamTagsRow: React.FCC<ImageStreamTagsRowProps> = ({
  imageStream,
  specTag,
  statusTag,
}) => {
  const imageStreamStatus = _.get(imageStream, 'status');
  const latest = _.get(statusTag, ['items', 0]);
  const from = _.get(specTag, 'from');
  const referencesTag = _.get(specTag, 'from.kind') === 'ImageStreamTag';
  const image = _.get(latest, 'image');
  const created = _.get(latest, 'created');
  const dockerRepositoryCheck = _.has(imageStream, [
    'metadata',
    'annotations',
    'openshift.io/image.dockerRepositoryCheck',
  ]);
  const { t } = useTranslation();
  return (
    <Tr>
      <Td modifier="breakWord">
        <ResourceLink
          kind={ImageStreamTagsReference}
          name={getImageStreamTagName(imageStream.metadata.name, statusTag.tag)}
          namespace={imageStream.metadata.namespace}
          title={statusTag.tag}
          linkTo={!!image}
        />
      </Td>
      <Td modifier="breakWord">
        {from && referencesTag && (
          <ResourceLink
            kind={ImageStreamTagsReference}
            name={from.name}
            namespace={imageStream.metadata.namespace}
            title={from.name}
          />
        )}
        {from && !referencesTag && <>{from.name}</>}
        {!from && <span className="pf-v6-u-text-color-subtle">{t('public~pushed image')}</span>}
      </Td>
      <Td modifier="breakWord" visibility={['hidden', 'visibleOnSm']}>
        {!imageStreamStatus && dockerRepositoryCheck && (
          <>
            <YellowExclamationTriangleIcon />
            &nbsp;{t('public~Unable to resolve')}
          </>
        )}
        {!imageStreamStatus && !dockerRepositoryCheck && !from && <>{t('public~Not synced yet')}</>}
        {/* We have no idea why in this case  */}
        {!imageStreamStatus && !dockerRepositoryCheck && from && <>{t('public~Unresolved')}</>}
        {imageStreamStatus && image && <>{image}</>}
        {imageStreamStatus && !image && (
          <>
            <YellowExclamationTriangleIcon />
            &nbsp;{t('public~There is no image associated with this tag')}
          </>
        )}
      </Td>
      <Td visibility={['hidden', 'visibleOnMd']}>
        {created && <Timestamp timestamp={created} />}
        {!created && '-'}
      </Td>
    </Tr>
  );
};

export const ExampleDockerCommandPopover: React.FCC<ImageStreamManipulationHelpProps> = ({
  imageStream,
  tag,
}) => {
  const publicImageRepository = _.get(imageStream, 'status.publicDockerImageRepository');
  const { t } = useTranslation();
  if (!publicImageRepository) {
    return null;
  }
  const loginCommand = 'oc registry login';
  const pushCommand = `docker push ${publicImageRepository}:${tag || '<tag>'}`;
  const pullCommand = `docker pull ${publicImageRepository}:${tag || '<tag>'}`;

  return (
    <Popover
      headerContent={<>{t('public~Image registry commands')}</>}
      className="co-example-docker-command__popover"
      minWidth="600px"
      bodyContent={
        <div>
          <p>
            {t(
              'public~Create a new ImageStreamTag by pushing an image to this ImageStream with the desired tag.',
            )}
          </p>
          <br />
          <p>{t('public~Authenticate to the internal registry')}</p>
          <CopyToClipboard value={loginCommand} />
          <br />
          <p>{t('public~Push an image to this ImageStream')}</p>
          <CopyToClipboard value={pushCommand} />
          <br />
          <p>{t('public~Pull an image from this ImageStream')}</p>
          <CopyToClipboard value={pullCommand} />
          <br />
          <p>
            <Trans t={t} ns="public">
              Red Hat Enterprise Linux users may use the equivalent <strong>podman</strong>{' '}
              commands.{' '}
            </Trans>
            <ExternalLink href={DOC_URL_PODMAN} text={t('public~Learn more.')} />
          </p>
        </div>
      }
    >
      <Button
        icon={<QuestionCircleIcon className="co-icon-space-r" />}
        className="pf-v6-u-display-none pf-v6-u-display-inline-flex-on-sm"
        type="button"
        variant="link"
      >
        {t('public~Do you need to work with this ImageStream outside of the web console?')}
      </Button>
    </Popover>
  );
};

export const ImageStreamsDetails: React.FCC<ImageStreamsDetailsProps> = ({ obj: imageStream }) => {
  const { t } = useTranslation();

  const getImportErrors = (): string[] => {
    return _.transform(imageStream.status.tags, (acc, tag: any) => {
      const importErrorCondition = _.find(
        tag.conditions,
        (condition) => condition.type === 'ImportSuccess' && condition.status === 'False',
      );
      importErrorCondition &&
        acc.push(
          t('public~Unable to sync image for tag {{tag}}. {{message}}', {
            tag: `${imageStream.metadata.name}:${tag.tag}`,
            message: importErrorCondition.message,
          }),
        );
    });
  };

  const imageRepository = _.get(imageStream, 'status.dockerImageRepository');
  const publicImageRepository = _.get(imageStream, 'status.publicDockerImageRepository');
  const imageCount = _.get(imageStream, 'status.tags.length');
  const specTagByName = _.keyBy(imageStream.spec.tags, 'name');
  const importErrors = getImportErrors();

  return (
    <div>
      <PaneBody>
        {!_.isEmpty(importErrors) && (
          <ExpandableAlert
            variant={AlertVariant.warning}
            alerts={_.map(importErrors, (error, i) => (
              <React.Fragment key={i}>{error}</React.Fragment>
            ))}
          />
        )}
        <SectionHeading text={t('public~ImageStream details')} />
        <Grid hasGutter>
          <GridItem md={6}>
            <ResourceSummary resource={imageStream}>
              {imageRepository && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('public~Image repository')}</DescriptionListTerm>
                  <DescriptionListDescription>{imageRepository}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {publicImageRepository && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('public~Public image repository')}</DescriptionListTerm>
                  <DescriptionListDescription>{publicImageRepository}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Image count')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {imageCount ? imageCount : 0}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </ResourceSummary>
            <ExampleDockerCommandPopover imageStream={imageStream} />
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Tags')} />
        {_.isEmpty(imageStream.status.tags) ? (
          <span className="pf-v6-u-text-color-subtle">{t('public~No tags')}</span>
        ) : (
          <PfTable gridBreakPoint="">
            <Thead>
              <Tr>
                <Th>{t('public~Name')}</Th>
                <Th>{t('public~From')}</Th>
                <Th visibility={['hidden', 'visibleOnSm']}>{t('public~Identifier')}</Th>
                <Th visibility={['hidden', 'visibleOnMd']}>{t('public~Last updated')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {_.map(imageStream.status.tags, (statusTag) => (
                <ImageStreamTagsRow
                  key={statusTag.tag}
                  imageStream={imageStream}
                  specTag={specTagByName[statusTag.tag]}
                  statusTag={statusTag}
                />
              ))}
            </Tbody>
          </PfTable>
        )}
      </PaneBody>
    </div>
  );
};

const ImageStreamHistory: React.FCC<ImageStreamHistoryProps> = ({ obj: imageStream }) => {
  const imageStreamStatusTags = _.get(imageStream, 'status.tags');
  return (
    <ImageStreamTimeline
      imageStreamTags={imageStreamStatusTags}
      imageStreamName={imageStream.metadata.name}
      imageStreamNamespace={imageStream.metadata.namespace}
    />
  );
};
ImageStreamHistory.displayName = 'ImageStreamHistory';

const pages = [
  navFactory.details(ImageStreamsDetails),
  navFactory.editYaml(),
  navFactory.history(ImageStreamHistory),
];
export const ImageStreamsDetailsPage: React.FCC = (props) => (
  <DetailsPage {...props} kind={ImageStreamsReference} menuActions={menuActions} pages={pages} />
);
ImageStreamsDetailsPage.displayName = 'ImageStreamsDetailsPage';

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'labels' },
  { id: 'created' },
  { id: 'actions' },
];

const getDataViewRows: GetDataViewRows<K8sResourceKind, undefined> = (data, columns) => {
  return data.map(({ obj: imageStream }) => {
    const { name, namespace, labels, creationTimestamp } = imageStream.metadata;

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ResourceLink kind={ImageStreamsReference} name={name} namespace={namespace} />,
        props: { ...getNameCellProps(name) },
      },
      [tableColumnInfo[1].id]: {
        cell: <ResourceLink kind="Namespace" name={namespace} />,
      },
      [tableColumnInfo[2].id]: {
        cell: <LabelList kind={ImageStreamsReference} labels={labels} />,
      },
      [tableColumnInfo[3].id]: {
        cell: <Timestamp timestamp={creationTimestamp} />,
      },
      [tableColumnInfo[4].id]: {
        cell: (
          <ResourceKebab
            actions={menuActions}
            kind={ImageStreamsReference}
            resource={imageStream}
          />
        ),
        props: actionsCellProps,
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || '-';
      return {
        id,
        props: rowCells[id]?.props,
        cell,
      };
    });
  });
};

const useImageStreamColumns = (): TableColumn<K8sResourceKind>[] => {
  const { t } = useTranslation();
  const columns: TableColumn<K8sResourceKind>[] = React.useMemo(() => {
    return [
      {
        title: t('public~Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Namespace'),
        id: tableColumnInfo[1].id,
        sort: 'metadata.namespace',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Labels'),
        id: tableColumnInfo[2].id,
        sort: 'metadata.labels',
        props: {
          modifier: 'nowrap',
          width: 20,
        },
      },
      {
        title: t('public~Created'),
        id: tableColumnInfo[3].id,
        sort: 'metadata.creationTimestamp',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[4].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ];
  }, [t]);
  return columns;
};

export const ImageStreamsList: React.FCC<ImageStreamsListProps> = ({ data, loaded, ...props }) => {
  const columns: TableColumn<K8sResourceKind>[] = useImageStreamColumns();

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<K8sResourceKind>
        {...props}
        label={ImageStreamModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        initialFilters={initialFiltersDefault}
        getDataViewRows={getDataViewRows}
        hideColumnManagement={true}
      />
    </React.Suspense>
  );
};

ImageStreamsList.displayName = 'ImageStreamsList';

export const buildPhase = (build) => build.status.phase;

export const ImageStreamsPage: React.FCC<ImageStreamsPageProps> = (props) => {
  const { t } = useTranslation();
  return (
    <ListPage
      {...props}
      title={t('public~ImageStreams')}
      kind={kind}
      ListComponent={ImageStreamsList}
      canCreate={true}
      omitFilterToolbar={true}
    />
  );
};

ImageStreamsPage.displayName = 'ImageStreamsListPage';

type ImageStreamTagsRowProps = {
  imageStream: K8sResourceKind;
  specTag: any;
  statusTag: any;
};

type ImageStreamHistoryProps = {
  obj: K8sResourceKind;
};

export type ImageStreamManipulationHelpProps = {
  imageStream: K8sResourceKind;
  tag?: string;
};

export type ImageStreamsDetailsProps = {
  obj: K8sResourceKind;
};

export type ImageStreamsPageProps = {
  filterLabel: string;
};

type ImageStreamsListProps = {
  data: K8sResourceKind[];
  loaded: boolean;
};
