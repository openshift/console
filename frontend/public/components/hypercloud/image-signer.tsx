import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { DetailsItem, Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { ImageSignerModel } from '../../models';
import { coFetchJSON } from '../../co-fetch';
import { SecretData } from './image-signer-key';
import { TargetsTable } from './targets-table';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(ImageSignerModel), ...Kebab.factory.common];

const kind = ImageSignerModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

const ImageSignerTableHeader = (t?: TFunction) => {
  return [
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_1'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_71'),
      sortField: 'spec.team',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_72'),
      sortField: 'spec.email',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_73'),
      sortField: 'spec.phone',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_12'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};

ImageSignerTableHeader.displayName = 'ImageSignerTableHeader';

const ImageSignerTableRow: RowFunction<K8sResourceKind> = ({ obj: imagesigner, index, key, style }) => {
  return (
    <TableRow id={imagesigner.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={imagesigner.metadata.name} namespace={imagesigner.metadata.namespace} title={imagesigner.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1])}>{imagesigner?.spec?.team}</TableData>
      <TableData className={classNames(tableColumnClasses[2])}>{imagesigner?.spec?.email}</TableData>
      <TableData className={classNames(tableColumnClasses[3])}>{imagesigner?.spec?.phone}</TableData>
      <TableData className={tableColumnClasses[4]}>
        <Timestamp timestamp={imagesigner.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={imagesigner} />
      </TableData>
    </TableRow>
  );
};

export const ImageSignerDetailsList: React.FC<ImageSignerDetailsListProps> = ({ ds: imagesigner }) => {
  const { t } = useTranslation();
  return (
    <dl className="co-m-pane__details">
      <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_7')} obj={imagesigner} path="spec.team" />
      <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_8')} obj={imagesigner} path="spec.email" />
      <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_9')} obj={imagesigner} path="spec.phone" />
      <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_10')} obj={imagesigner} path="spec.description" />
    </dl>
  );
}

// const TargetsTable: React.FC = props => <Table {...props} aria-label="ImageSigners" Header={ImageSignerKeyTargetTableHeader} Row={ImageSignerKeyTargetTableRow} virtualize />;

const ImageSignerDetails: React.FC<ImageSignerDetailsProps> = ({ obj: imagesigner }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={`${t('COMMON:MSG_LNB_MENU_91')} ${t('COMMON:MSG_DETAILS_TABOVERVIEW_1')}`} />
        <div className="row">
          <div className="col-lg-6">
            <ResourceSummary resource={imagesigner} showOwner={false} />
            <DetailsItem label={t('COMMON:MSG_DETAILS_TABREPLICASETS_5')} obj={imagesigner} path="spec.owner" />
          </div>
          <div className="col-lg-6">
            <ImageSignerDetailsList ds={imagesigner} />
          </div>
        </div>
      </div>
    </>
  );
}

const fetchSignerKey = singerkey => {
  const url = `/api/kubernetes/apis/tmax.io/v1/signerkeys/${singerkey}`;
  return coFetchJSON(url).then(response => {
    console.log(response);
    return response;
  });
};

const SignerKeyDetails: React.FC<SignerKeyDetailsProps> = ({ obj: imagesigner }) => {
  const { t } = useTranslation();

  const [data, setData] = React.useState([]);
  const [root, setRoot] = React.useState({
    id: '',
    key: '',
    passPhrase: '',
  });
  // const [targets, setTargets] = React.useState({
  //   id: '',
  //   key: '',
  //   passPhrase: '',
  // });
  React.useEffect(() => {
    fetchSignerKey(imagesigner?.metadata?.name).then(data => {
      const preData = [];
      setRoot(data.spec.root);
      _.forEach(data.spec.targets, (value, key) => {
        preData.push(value);
      });
      console.log('확인해봐라:', preData);
      setData(preData);
    });
  }, []);
  return (
    <>
      <div className="co-m-pane__body">
        <div className="row">
          <div className="col-lg-12">
            <SecretData data={root} title={`${t('COMMON:MSG_DETAILS_TABSIGNERKEY_1')} ${t('COMMON:MSG_DETAILS_TABOVERVIEW_1')}`} isTable={false} />
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <TargetsTable resource={data} heading={`${t('COMMON:MSG_DETAILS_TABDETAILS_METRICS_TABLEHEADER_5')}`} />
      </div>
    </>
  );
};

const { details, editYaml, signerKey } = navFactory;

export const ImageSigners: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="ImageSigners" Header={ImageSignerTableHeader.bind(null, t)} Row={ImageSignerTableRow} virtualize />;
};

export const ImageSignersPage: React.FC<ImageSignersPageProps> = props => {
  const { t } = useTranslation();

  return <ListPage
    title={t('COMMON:MSG_LNB_MENU_91')}
    createButtonText={t('COMMON:MSG_MAIN_CREATEBUTTON_1', { 0: t('COMMON:MSG_LNB_MENU_91') })}
    canCreate={props.isDetailPage ? false : true}
    ListComponent={ImageSigners}
    kind={kind}
    {...props}
  />;
};

export const ImageSignersDetailsPage: React.FC<ImageSignersDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(ImageSignerDetails)), editYaml(), signerKey(SignerKeyDetails)]} />;

type ImageSignerDetailsListProps = {
  ds: K8sResourceKind;
};

type ImageSignersPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
  isDetailPage?: boolean;
};

type SignerKeyDetailsProps = {
  obj: K8sResourceKind;
};

type ImageSignerDetailsProps = {
  obj: K8sResourceKind;
};

type ImageSignersDetailsPageProps = {
  match: any;
};
