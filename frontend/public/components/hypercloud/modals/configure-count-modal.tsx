import * as _ from 'lodash-es';
import * as React from 'react';

import { k8sPatch, K8sResourceKind, K8sKind } from '../../../module/k8s';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../../factory/modal';
import { NumberSpinner, withHandlePromise } from '../../utils';
import { Section } from '../utils/section';

export const ConfigureCountModal = withHandlePromise((props: ConfigureCountModalProps) => {
    console.log('configure count modal');
    console.log({ props });

    const getPath1 = props.path1.substring(1).replace('/', '.');
    const [value1, setValue1] = React.useState<number>(
        _.get(props.resource, getPath1) || props.defaultValue,
    );

    const getPath2 = props.path2.substring(1).replace('/', '.');
    const [value2, setValue2] = React.useState<number>(
        _.get(props.resource, getPath2) || props.defaultValue,
    );

    const submit = (e) => {
        e.preventDefault();

        const patch1 = [{ op: 'replace', path: props.path1, value: _.toInteger(value1) }];

        const patch2 = [{ op: 'replace', path: props.path2, value: _.toInteger(value2) }];

        const invalidateState = props.invalidateState || _.noop;

        invalidateState(true, _.toInteger(value1));

        invalidateState(true, _.toInteger(value2));

        props
            .handlePromise(k8sPatch(props.resourceKind, props.resource, patch1))
            .then(props.close)
            .catch((error) => {
                invalidateState(false);
                throw error;
            });

        props
            .handlePromise(k8sPatch(props.resourceKind, props.resource, patch2))
            .then(props.close)
            .catch((error) => {
                invalidateState(false);
                throw error;
            });
    };

    return (
        <form onSubmit={submit} name="form" className="modal-content ">
            <ModalTitle>{props.title}</ModalTitle>
            <ModalBody>
                <p>{props.message}</p>
                <Section label="Master Node" id="master-node">
                    <NumberSpinner
                        className="pf-c-form-control"
                        value={value1}
                        onChange={(e: any) => setValue1(e.target.value)}
                        changeValueBy={(operation) => setValue1(_.toInteger(value1) + operation * 2)}
                        autoFocus
                        required
                        min={1}
                    />
                </Section>
                <Section label="Worker Node" id="worker-node">
                    <NumberSpinner
                        className="pf-c-form-control"
                        value={value2}
                        onChange={(e: any) => setValue2(e.target.value)}
                        changeValueBy={(operation) => setValue2(_.toInteger(value2) + operation)}
                        autoFocus
                        required
                        min={1}
                    />
                </Section>
            </ModalBody>
            <ModalSubmitFooter
                errorMessage={props.errorMessage}
                inProgress={props.inProgress}
                submitText={props.buttonText}
                cancel={props.cancel}
            />
        </form>
    );
});

export const configureCountModal = createModalLauncher(ConfigureCountModal);

export const configureClusterNodesModal = (props) => {
    console.log('configure cluster nodes modal');
    console.log({ props });
    return configureCountModal(
        _.defaults(
            {},
            {
                defaultValue: 1,
                title: 'Edit Nodes',
                message: `Master node and worker node can be scaled.`,
                // path: '/spec/masterNum',
                path1: '/spec/masterNum',
                path2: '/spec/workerNum',
                buttonText: 'Save',
            },
            props,
        )
    )
}

export type ConfigureCountModalProps = {
    message: string;
    buttonText: string;
    defaultValue: number;
    // path: string;
    path1: string;
    path2: string;
    resource: K8sResourceKind;
    resourceKind: K8sKind;
    title: string;
    invalidateState?: (isInvalid: boolean, count?: number) => void;
    handlePromise: <T>(promise: Promise<T>) => Promise<T>;
    inProgress: boolean;
    errorMessage: string;
    cancel?: () => void;
    close?: () => void;
};
