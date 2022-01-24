import { history } from '@console/internal/components/utils';
import {
  VIRTUALMACHINES_BASE_URL,
  VIRTUALMACHINES_TEMPLATES_BASE_URL,
} from '../../../constants/url-params';
import { getName, getNamespace } from '../../../selectors';
import { VMGenericLikeEntityKind } from '../../../types/vmLike';

export const redirectToList = (vmi: VMGenericLikeEntityKind, isTemplate?: boolean) => {
  // If we are currently on the deleted resource's page, redirect to the resource list page
  const re = new RegExp(`/${getName(vmi)}(/|$)`);

  if (re.test(window.location.pathname)) {
    history.push(
      `/k8s/ns/${getNamespace(vmi)}/${
        isTemplate ? VIRTUALMACHINES_TEMPLATES_BASE_URL : VIRTUALMACHINES_BASE_URL
      }/`,
    );
  }
};
