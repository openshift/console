import { history } from '@console/internal/components/utils';
import { getName, getNamespace } from '@console/shared/src/selectors/common';
import { VMGenericLikeEntityKind } from 'packages/kubevirt-plugin/src/types/vmLike';

export const redirectToList = (vmi: VMGenericLikeEntityKind, tab?: 'templates' | '' | null) => {
  // If we are currently on the deleted resource's page, redirect to the resource list page
  const re = new RegExp(`/${getName(vmi)}(/|$)`);
  if (re.test(window.location.pathname)) {
    history.push(`/k8s/ns/${getNamespace(vmi)}/virtualization/${tab || ''}`);
  }
};
