import * as _ from 'lodash-es';
import * as React from 'react';
import { K8sResourceKind } from '../../module/k8s';
import { DetailsItem, Firehose, FirehoseResource, SectionHeading } from '../utils';
import { useTranslation } from 'react-i18next';
import { Conditions } from '@console/internal/components/conditions';
import { ResourceLink } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';

export const NotaryDetailsList: React.FC<NotaryDetailsListProps> = ({ ds }) => {
    const { t } = useTranslation();

    return (
        <dl className="co-m-pane__details">
            <DetailsItem label="Server URL" obj={ds} path="status.notaryURL">
                {ds.status.notaryURL}
            </DetailsItem>
            <DetailsItem label={t('COMMON:MSG_DETAILS_TABNOTARY_2')} obj={ds} path="spec.authConfig">
                <div>
                    realm: {ds.spec.authConfig.realm}
                </div>
                <div>
                    issuer: {ds.spec.authConfig.issuer}
                </div>
                <div>
                    service: {ds.spec.authConfig.service}
                </div>
            </DetailsItem>
            <DetailsItem label={t('SINGLE:MSG_IMAGEREGISTRIES_CREATEFORM_DIV2_13')} obj={ds} path="spec.serviceType">
                {ds.spec.serviceType}
            </DetailsItem>
            <DetailsItem label={t('COMMON:MSG_LNB_MENU_52')} obj={ds} path="spec.persistentVolumeClaim">
                <ResourceLink kind={referenceFor({ kind: 'PersistentVolumeClaim', apiVersion: 'v1' })} name={ds.spec.persistentVolumeClaim.exist?.pvcName ? ds.spec.persistentVolumeClaim.exist.pvcName : `hpcd-notary-db-${ds.metadata.name}`}
                />
            </DetailsItem>
        </dl>
    )
};


export const NotaryDetails: React.FC<NotaryDetailsProps> = props => {
    const { t } = useTranslation();

    const obj = props.resources.obj.data;

    return (
        Object.keys(obj).length !== 0 && <>
            <div className="co-m-pane__body">
                <SectionHeading text={`${t('COMMON:MSG_DETAILS_TABNOTARY_1')} ${t('COMMON:MSG_DETAILS_TABOVERVIEW_1')}`} />
                <div className="row">
                    <div className="col-lg-6">
                        <NotaryDetailsList ds={obj} />
                    </div>
                </div>
            </div>
            <div className="co-m-pane__body">
                <SectionHeading text={`${t('COMMON:MSG_DETAILS_TABNOTARY_5')}`} />
                <Conditions conditions={obj.status?.conditions} showMessage={false} showReason={false} />
            </div>
        </>
    );
}

export const NotariesDetailsPage: React.FC<NotariesDetailsPageProps> = props => (
    <Firehose
        resources={[
            {
                kind: props.kind,
                kindObj: props.kindObj,
                name: props.name,
                namespace: props.namespace,
                isList: false,
                prop: 'obj',
            } as FirehoseResource,
        ]}
    >
        <NotaryDetails {...props} />
    </Firehose>
)




type NotaryDetailsListProps = {
    ds: K8sResourceKind;
};

type NotaryDetailsProps = {
    resources?: any;
};

type NotariesDetailsPageProps = {
    kind: any;
    kindObj: any;
    name: string;
    namespace: string;
    match: any;
};
