import type { ModalComponent } from '../app/modal-support/ModalProvider';
import type { Extension, CodeRef } from '../types';
import type { K8sResourceCommon } from './console-types';

export type CreateProjectModalProps = {
  onSubmit?: (project: K8sResourceCommon) => void;
};

/** This extension can be used to pass a component that will be rendered in place of the standard create project modal. */
export type CreateProjectModal = Extension<
  'console.create-project-modal',
  {
    /** A component to render in place of the create project modal */
    component: CodeRef<ModalComponent<CreateProjectModalProps>>;
  }
>;

export const isCreateProjectModal = (e: Extension): e is CreateProjectModal =>
  e.type === 'console.create-project-modal';
