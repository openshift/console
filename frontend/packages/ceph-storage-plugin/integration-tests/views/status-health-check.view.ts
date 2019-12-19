import { $, $$, element, by, } from 'protractor';
import { getPodData } from '../utils/helpers'
import { execSync } from 'child_process';

export let mainHealthCardStatus = $('.co-dashboard-card__body--top-margin.co-health-card__body');
export const mainHealtGreenSvg = mainHealthCardStatus.$('svg[fill="var(--pf-chart-color-green-400)"]');
export const seeAllLink = element(by.cssContainingText('.co-dashboard-card__button-link.btn.btn-link', 'See all'));
export const seeAllClose = $('button[aria-label="Close"]');
export let seeAllCard = $('.pf-c-popover__body');
export let seeAllCardSections = seeAllCard.$$('.co-health-card__item');
export let seeAllStorageSection = seeAllCardSections.get(1);
export const seeAllStorageGreenSvg = seeAllStorageSection.$('svg[fill="var(--pf-chart-color-green-400)"]');
export const mainHealtYellowSvg = mainHealthCardStatus.$('svg[fill="#f0ab00"]');
export const seeAllCardYellow = $('.pf-c-popover__body');
export const seeAllStorageYellowSvg = seeAllStorageSection.$('svg[fill="#f0ab00"]');
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
}

export const mainHealtRedSvg = mainHealthCardStatus.$('svg[fill="#c9190b"]');
export const seeAllCardRed = $('.pf-c-popover__body');
export const seeAllCardSectionsRed = seeAllCard.$$('.co-health-card__item');
export const seeAllStorageRedSvg = seeAllStorageSection.$('svg[fill="#c9190b"]');





