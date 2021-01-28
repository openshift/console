import * as _ from 'lodash-es';
import { ValidTabGuard } from 'packages/kubevirt-plugin/src/components/create-vm-wizard/tabs/valid-tab-guard';
import * as React from 'react';
import { history } from '@console/internal/components/utils';
import { k8sCreateUrl, k8sList, referenceForModel, kindForReference } from '../../../module/k8s';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../../factory/modal';
import { PromiseComponent, ResourceIcon, SelectorInput } from '../../utils';
import { Section } from '../utils/section';
import { ResourceListDropdown, RegistryListDropdown } from '../../resource-dropdown';
import { Button, Chip, ChipGroup, ChipGroupToolbarItem } from '@patternfly/react-core';
import { CloseIcon } from '@patternfly/react-icons';
import { ResourceIcon } from '../utils';
import { modelFor } from '../../../module/k8s/k8s-models';
import { NamespaceModel } from '@console/internal/models';
import { withRouter } from 'react-router-dom';
import { oidcClientIDInput } from 'integration-tests/views/oauth.view';

class BaseScanningModal extends PromiseComponent {
    constructor(props) {
        super(props);
        this._submit = this._submit.bind(this);
        this._cancel = props.cancel.bind(this);

        this.state = Object.assign(this.state, {
            name: '',
            dataList: [],
            namespaces: [],
            namespace: '',
            resources: [],
            resource: [],
        });
    }

    componentDidMount() {
        const { showNs } = this.props;
        showNs && this.getNamespaceList();
        const { ns } = this.props;
        this.setState({ namespace: ns });
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.namespace !== this.state.namespace && prevProps.resource?.kind !== 'Tag') {
            return this.getResourceList();
        }
    }

    async getNamespaceList() {
        const { ns } = this.props;
        const list = await k8sList(NamespaceModel);
        const namespaces = list.map(item => item.metadata.name);
        const namespace = ns || namespaces[0];
        this.setState({ namespaces, namespace });
    }

    async getResourceList() {
        const { kind, ns, labelSelector } = this.props;
        const list = await k8sList(modelFor(kind), { ns: this.state.namespace, labelSelector });
        const resources = list.map(item => item.metadata.name);
        return this.setState({ resources });
    }

    _submit(e) {
        e.preventDefault();

        let { kind, ns, modelKind, resource, labelSelector } = this.props;

        let registries;

        kind = kind || resource?.kind;

        if (kind === 'Registry' || modelKind?.kind === 'Registry') {
            if (resource) {
                registries = [{
                    'name': resource.metadata.name,
                    'repositories': [
                        {
                            'name': '*'
                        }
                    ]
                }];
            }
            else {
                registries = this.state.resource.map(selectedItem => ({
                    'name': selectedItem,
                    'repositories': [
                        {
                            'name': '*'
                        }
                    ]
                }))
            }
        } else if (kind === 'Repository' || modelKind?.kind === 'Repository') {
            if (resource) {
                registries = [{
                    'name': resource.spec.registry,
                    'repositories': [
                        {
                            'name': resource.metadata.name,
                            'versions': [
                                '*'
                            ]
                        }
                    ]
                }];
            }
            else {
                registries = [{
                    'name': labelSelector.registry,
                    'repositories': this.state.resource.map(selectedItem => (
                        {
                            'name': selectedItem,
                            'versions': [
                                '*'
                            ]
                        }
                    ))
                }];
            }
        } else if (kind === 'Tag') {
            registries = [{
                'name': resource.registry,
                'repositories': [
                    {
                        'name': resource.repository,
                        'versions': [
                            resource.version
                        ]
                    }
                ]
            }];
        }

        const data = { registries };


        const opts = {
            ns: (this.state.namespace !== '' && this.state.namespace) || resource.metadata?.namespace || resource.namespace,
            plural: 'scans',
            name: this.state.name,
        };
        let model = kind ? modelFor(kind) : modelKind;

        model = model || { apiVersion: 'v1' };

        model.apiGroup = 'registry.tmax.io';
        model.plural = 'scans';

        const promise = k8sCreateUrl(model, data, opts);
        this.handlePromise(promise)
            .then(this.successSubmit);
    }

    successSubmit = ({ imageScanRequestName }) => {
        const { resource } = this.props;

        const namespace = resource?.metadata?.namespace || this.state.namespace || resource?.namespace;

        this.props.close();
        history.push(`/k8s/ns/${namespace}/imagescanrequests/${imageScanRequestName}`);
    }

    onChangeName = (e) => {
        this.setState({ name: e.target.value });
    }

    onChangeNamespace = (e) => {
        this.setState({ namespace: e.target.value });
    }

    onChangeResource = (e) => {
        const resource = Array.from(e.target.selectedOptions, option => option.value);
        this.setState({ resource });
    }

    render() {
        const { kind, showNs, resource, message, modelKind } = this.props;
        const { selected } = this.state;

        let label;
        if (kind === 'Registry' || modelKind?.kind === 'Registry') {
            label = 'Image Registry';
        } else {
            label = kind || modelKind?.kind || resource?.kind;
        }

        const name = resource?.metadata?.name || resource?.version;

        return (
            <form onSubmit={this._submit} name="form" className="modal-content">
                <ModalTitle>Image Scan Request Creation</ModalTitle>
                <ModalBody unsetOverflow={true}>
                    <div className="row co-m-form-row">
                        <div className="col-sm-12">
                            {message || ''}
                        </div>
                    </div>
                    <div className="row co-m=-form-row">
                        <div className="col-sm-12" style={{ marginBottom: '15px' }}>
                            <Section label="Name" id="name" isRequired={true}>
                                <input className="pf-c-form-control" id="name" name="metadata.name" onChange={this.onChangeName} value={this.state.name} />
                            </Section>
                        </div>
                        {showNs && <div className="col-sm-12" style={{ marginBottom: '15px' }}>
                            <Section label="Namespace" id="namespace" isRequired={true}>
                                <select className="col-sm-12" value={this.state.namespace} onChange={this.onChangeNamespace}>
                                    {this.state.namespaces.map(namespace => <option key={namespace} value={namespace}>{namespace}</option>)}
                                </select>
                            </Section>
                        </div>}
                        <div className="col-sm-12">
                            <label className={'control-label co-required'} htmlFor={label}>
                                {label}
                            </label>
                            <div className="co-search-group">
                                {resource ?
                                    <div>{name}</div> :
                                    <select className="col-sm-12" value={this.state.resource} onChange={this.onChangeResource} multiple>
                                        {this.state.resources.map((resource, idx) => <option key={idx} value={resource}>{resource}</option>)}
                                    </select>
                                }
                            </div>
                        </div>
                    </div>
                </ModalBody>
                <ModalSubmitFooter
                    errorMessage={this.state.errorMessage}
                    inProgress={this.state.inProgress}
                    submitText="Confirm"
                    cancel={this._cancel}
                />
            </form>
        )
    }
};

export const scanningModal = createModalLauncher((props) => (
    <BaseScanningModal {...props} />
));
