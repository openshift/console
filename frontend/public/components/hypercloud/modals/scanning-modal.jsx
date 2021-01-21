import * as _ from 'lodash-es';
import { ValidTabGuard } from 'packages/kubevirt-plugin/src/components/create-vm-wizard/tabs/valid-tab-guard';
import * as React from 'react';

import { k8sCreateUrl, k8sList, referenceForModel, kindForReference } from '../../../module/k8s';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../../factory/modal';
import { PromiseComponent, ResourceIcon, SelectorInput } from '../../utils';
import { Section } from '../utils/section';
import { ResourceListDropdown, RegistryListDropdown } from '../../resource-dropdown';
import { Button, Chip, ChipGroup, ChipGroupToolbarItem } from '@patternfly/react-core';
import { CloseIcon } from '@patternfly/react-icons';
import { ResourceIcon } from '../utils';
// import { RegistryModel } from '../../../models/hypercloud';
import { modelFor } from '../../../module/k8s/k8s-models';
import { NamespaceModel } from '@console/internal/models';

class BaseScanningModal extends PromiseComponent {
    constructor(props) {
        super(props);
        console.log('base scanning modal');
        console.log({ props });

        this._submit = this._submit.bind(this);
        this._cancel = props.cancel.bind(this);

        this.state = Object.assign(this.state, {
            name: '',
            selected: new Set([]),
            allData: [],
            namespaces: [],
            namespace: '',
        });
    }

    componentDidMount() {
        this.getNamespaceList();
    }

    async getNamespaceList() {
        const list = await k8sList(NamespaceModel);
        const namespaces = list.map(item => item.metadata.name);
        this.setState({ namespaces, namespace: namespaces[0] });
    }

    _submit(e) {
        e.preventDefault();

        const { kind, ns } = this.props;

        let registries;
        const selectedArray = Array.from(this.state.selected);

        if (kind === 'Registry') {
            registries = selectedArray.map(selectedItem => ({
                'name': selectedItem,
                'repositories': [
                    {
                        'name': '*'
                    }
                ]
            }))
        }
        const data = { registries };


        const opts = {
            ns,
            plural: 'scans',
            name: this.state.name,
        };
        const model = modelFor(kind);

        model.apiGroup = 'registry.' + model.apiGroup;
        model.plural = 'scans';


        const promise = k8sCreateUrl(model, data, opts);
        this.handlePromise(promise)
            .then(this.successSubmit);
    }

    successSubmit = () => {
        this.props.close();
    }

    onChangeName = (e) => {
        this.setState({ name: e.target.value });
    }

    onChangeNamespace = (e) => {
        this.setState({ namespace: e.target.value });
    }

    toggleSelected = selection => {
        if (this.state.selected.has('All') || selection === 'All') {
            this.setState({ selected: new Set([selection]) });
        } else {
            const updateItems = new Set(this.state.selected);
            updateItems.has(selection) ? updateItems.delete(selection) : updateItems.add(selection);
            this.setState({ selected: updateItems });
        }
    };

    clearSelection = () => {
        this.setState({ selected: new Set([]) });
    };

    setAllData = (allData) => {
        this.setState(({ allData: [...allData] }));
    }

    render() {
        const { kind, resource, message } = this.props;
        const { selected } = this.state;

        let label;
        if (kind === 'Registry') {
            label = 'Image Registry';
        } else {
            label = kind;
        }

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
                        <div className="col-sm-12" style={{ marginBottom: '15px' }}>
                            <Section label="Namespace" id="namespace" isRequired={true}>
                                <select className="col-sm-12" value={this.state.namespace} onChange={this.onChangeNamespace}>
                                    {this.state.namespaces.map(namespace => <option value={namespace}>{namespace}</option>)}
                                </select>
                            </Section>
                        </div>
                        <div className="col-sm-12">
                            <label className={'control-label co-required'} htmlFor={label}>
                                {label}
                            </label>
                            <div className="co-search-group">
                                <RegistryListDropdown onChange={this.toggleSelected} selected={Array.from(selected)} showAll clearSelection={this.clearSelection} setAllData={this.setAllData} namespace={this.state.namespace} className="co-search-group__registry" />
                            </div>
                            <div className="form-group">
                                <ChipGroup withToolbar defaultIsOpen={false}>
                                    <ChipGroupToolbarItem key="resources-category" categoryName="Registry">
                                        {[...selected].map(chip => (
                                            <Chip key={chip} onClick={() => this.toggleSelected(chip)}>
                                                <ResourceIcon kind={chip} />
                                                {kindForReference(chip)}
                                            </Chip>
                                        ))}
                                        {selected.size > 0 && (
                                            <>
                                                <Button variant="plain" aria-label="Close" onClick={this.clearSelection}>
                                                    <CloseIcon />
                                                </Button>
                                            </>
                                        )}
                                    </ChipGroupToolbarItem>
                                </ChipGroup>
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
}

export const scanningModal = createModalLauncher((props) => (
    <BaseScanningModal {...props} />
));