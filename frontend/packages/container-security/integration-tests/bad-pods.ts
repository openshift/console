import { vulnPriority, Priority } from '../src/const';
import { ImageManifestVuln } from '../src/types';

export const fakeVulnFor = (priority: Priority): ImageManifestVuln => {
  return {
    apiVersion: 'secscan.quay.redhat.com/v1alpha1',
    kind: 'ImageManifestVuln',
    metadata: {
      creationTimestamp: '2019-12-23T18:30:33Z',
      generation: 76,
      labels: {
        'default/3scale-operator-7864b9bb5d-frhnt': 'true',
      },
      name: `sha256.e94c22ba519b1e0ae035e1786a7d2eb9425d62ff60be8ba2dc6b86234540bcb${
        vulnPriority.get(priority).index
      }`,
      namespace: 'default',
      resourceVersion: '3082821',
      uid: `74b640b4-0503-4fbe-9354-1939630e082${vulnPriority.get(priority).index}`,
    },
    spec: {
      features: [
        {
          name: 'libcurl',
          namespaceName: 'centos:7',
          version: '7.29.0-51.el7',
          versionformat: 'rpm',
          vulnerabilities: [
            {
              description:
                'The curl packages provide the libcurl library and the curl utility for downloading files from servers using various protocols, including HTTP, FTP, and LDAP. Security Fix(es): * curl: NTLM password overflow via integer overflow (CVE-2018-14618) For more details about the security issue(s), including the impact, a CVSS score, acknowledgments, and other related information, refer to the CVE page(s) listed in the References section. Bug Fix(es): * baseurl with file:// hangs and then timeout in yum repo (BZ#1709474) * curl crashes on http links with rate-limit (BZ#1711914)',
              fixedby: '0:7.29.0-51.el7_6.3',
              link: 'https://access.redhat.com/errata/RHSA-2019:1880',
              name: 'RHSA-2019:1880',
              namespaceName: 'centos:7',
              severity: vulnPriority.get(priority).title,
            },
          ],
        },
        {
          name: 'libssh2',
          namespaceName: 'centos:7',
          version: '1.4.3-12.el7_6.2',
          versionformat: 'rpm',
          vulnerabilities: [
            {
              description:
                'The libssh2 packages provide a library that implements the SSH2 protocol. Security Fix(es): * libssh2: Out-of-bounds memory comparison with specially crafted message channel request (CVE-2019-3862) For more details about the security issue(s), including the impact, a CVSS score, acknowledgments, and other related information, refer to the CVE page(s) listed in the References section.',
              fixedby: '0:1.4.3-12.el7_6.3',
              link: 'https://access.redhat.com/errata/RHSA-2019:1884',
              name: 'RHSA-2019:1884',
              namespaceName: 'centos:7',
              severity: 'Low',
            },
            {
              description:
                'The libssh2 packages provide a library that implements the SSH2 protocol. The following packages have been upgraded to a later upstream version: libssh2 (1.8.0). (BZ#1592784) Security Fix(es): * libssh2: Zero-byte allocation with a specially crafted SFTP packed leading to an out-of-bounds read (CVE-2019-3858) * libssh2: Out-of-bounds reads with specially crafted SSH packets (CVE-2019-3861) For more details about the security issue(s), including the impact, a CVSS score, acknowledgments, and other related information, refer to the CVE page(s) listed in the References section. Additional Changes: For detailed information on changes in this release, see the Red Hat Enterprise Linux 7.7 Release Notes linked from the References section.',
              fixedby: '0:1.8.0-3.el7',
              link: 'https://access.redhat.com/errata/RHSA-2019:2136',
              name: 'RHSA-2019:2136',
              namespaceName: 'centos:7',
              severity: 'Medium',
            },
          ],
        },
      ],
      image: 'quay.io/alecmerdler/bad-pod',
      manifest: 'sha256:e94c22ba519b1e0ae035e1786a7d2eb9425d62ff60be8ba2dc6b86234540bcbf',
      namespaceName: 'centos:7',
    },
    status: {
      affectedPods: {
        'default/3scale-operator-7864b9bb5d-frhnt': [
          'cri-o://fa5adc149410ef015919abd1b7b0f747d1cc8958f76e4d6ce79538d701018abc',
        ],
      },
      fixableCount: 0,
      highCount: 0,
      highestSeverity: vulnPriority.get(priority).title,
      lastUpdate: '2019-12-27 22:00:48.328470155 +0000 UTC',
      lowCount: 1,
      mediumCount: 1,
    },
  };
};
