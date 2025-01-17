import { ModalComponent } from '../app/modal-support/ModalProvider';
import { Extension, ExtensionDeclaration, CodeRef } from '../types';
import { K8sResourceCommon } from './console-types';

export type CreateProjectModalProps = {
  onSubmit?: (project: K8sResourceCommon) => void;
  pluginUID?: string;
};

/** This extension can be used to pass a component that will be rendered in place of the standard create project modal. */
export type CreateProjectModal = ExtensionDeclaration<
  'console.create-project-modal',
  {
    /** A component to render in place of the create project modal */
    component: CodeRef<ModalComponent<CreateProjectModalProps>>;
    /**
     * The label for this extension. This property is used to distinguish between multiple
     * CreateProjectModal extensions. In such cases, the `label` property is displayed as an option
     * in a dropdown menu in place of the normal singular Project creation buttons. If no label is
     * defined and multiple CreateProjectModal extensions are defined, a fallback value "Create
     * Project using <pluginName>" will be used.
     */
    label: string;
  }
>;

export const isCreateProjectModal = (e: Extension): e is CreateProjectModal =>
  e.type === 'console.create-project-modal';
