import { execSync } from 'child_process';
import { $, element, by } from 'protractor';
import { getPodData } from '../utils/helpers';
import { OCP_HEALTH_ICON_COLORS } from '../utils/consts';

export const mainHealthCardStatus = $('.co-dashboard-card__body--top-margin.co-health-card__body');
export const mainHealtGreenSvg = mainHealthCardStatus.$(
  `svg[fill="${OCP_HEALTH_ICON_COLORS.GREEN}"]`,
);
export const seeAllLink = element(
  by.cssContainingText('.co-dashboard-card__button-link.btn.btn-link', 'See all'),
);
export const seeAllClose = $('button[aria-label="Close"]');
export const seeAllCard = $('.pf-c-popover__body');
export const seeAllCardSections = seeAllCard.$$('.co-health-card__item');
export const seeAllStorageSection = seeAllCardSections.get(1);
export const seeAllStorageGreenSvg = seeAllStorageSection.$(
  `svg[fill="${OCP_HEALTH_ICON_COLORS.GREEN}"]`,
);
export const mainHealtYellowSvg = mainHealthCardStatus.$(
  `svg[fill="${OCP_HEALTH_ICON_COLORS.YELLOW}"]`,
);
export const seeAllStorageYellowSvg = seeAllStorageSection.$(
  `svg[fill="${OCP_HEALTH_ICON_COLORS.YELLOW}"]`,
);
export const noOutChange = (setNoOut: string) => {
  const podsList = JSON.parse(
    execSync('kubectl get po -n openshift-storage -o json').toString('utf-8'),
  );
  const pods = podsList.items;
  const opPod = getPodData(pods, 'ceph-operator');
  const opPodName = opPod.metadata.name;
  execSync(`oc -n openshift-storage rsh  ${opPodName} \
        ceph --conf=/var/lib/rook/openshift-storage/openshift-storage.config \
        osd ${setNoOut} noout`);
};

export const mainHealtRedSvg = mainHealthCardStatus.$(`svg[fill="${OCP_HEALTH_ICON_COLORS.RED}"]`);
export const seeAllStorageRedSvg = seeAllStorageSection.$(
  `svg[fill="${OCP_HEALTH_ICON_COLORS.RED}"]`,
);
