import * as _ from 'lodash';
import { compareVersions, removeOSDups } from '../sort';
import { OperatingSystemRecord } from '../../types/types';

/**
 * Compare two versions: ver1 and ver2
 * return  1 : ver1 > ver2
 * return -1 : ver1 < ver2
 * return  0 : ver1 = ver2
 */

describe('compareVersions', () => {
  const osVersion0: number[] = null;
  const osVersion1: number[] = [1, 2, 3];
  const osVersion2: number[] = [1, 2, 4];
  const osVersion3: number[] = [1, 1];
  const osVersion4: number[] = [1];
  const osVersion5: number[] = [2];
  const osVersion6: number[] = [1, 0];
  const osVersion7: number[] = [1, 0, 0];
  const osVersion8: number[] = [0];
  const osVersion9: number[] = [0, 0, 0];

  it('check non-equal versions with same length', () => {
    expect(compareVersions(osVersion1, osVersion2)).toEqual(-1);
    expect(compareVersions(osVersion2, osVersion1)).toEqual(1);
    expect(compareVersions(osVersion5, osVersion4)).toEqual(1);
  });

  it('check non-equal versions with different length', () => {
    expect(compareVersions(osVersion1, osVersion3)).toEqual(1);
    expect(compareVersions(osVersion5, osVersion2)).toEqual(1);
    expect(compareVersions(osVersion2, osVersion6)).toEqual(1);
    expect(compareVersions(osVersion4, osVersion1)).toEqual(-1);
  });

  it('check equal versions with same length', () => {
    expect(compareVersions(osVersion1, osVersion1)).toEqual(0);
    expect(compareVersions(osVersion3, osVersion3)).toEqual(0);
    expect(compareVersions(osVersion4, osVersion4)).toEqual(0);
  });

  it('check equal versions with different length', () => {
    expect(compareVersions(osVersion4, osVersion6)).toEqual(0);
    expect(compareVersions(osVersion7, osVersion4)).toEqual(0);
    expect(compareVersions(osVersion7, osVersion6)).toEqual(0);
  });

  it('check non-equal versions when one of them is null', () => {
    expect(compareVersions(osVersion0, osVersion6)).toEqual(-1);
    expect(compareVersions(osVersion2, osVersion0)).toEqual(1);
  });

  it('check equal versions when one of them is null and the other has only zeros', () => {
    expect(compareVersions(osVersion0, osVersion8)).toEqual(0);
    expect(compareVersions(osVersion9, osVersion0)).toEqual(0);
  });

  it('check equal versions when both of them are null', () => {
    expect(compareVersions(osVersion0, osVersion0)).toEqual(0);
  });
});

describe('removeOSDups', () => {
  const osWithDups: OperatingSystemRecord[] = [
    { id: 'centos8.0', name: 'CentOS 8.0 or higher' },
    { id: 'centos7', name: 'CentOS 7.0 or higher' },
    { id: 'centos7.1', name: 'CentOS 7.0 or higher' },
    { id: 'centos7.10', name: 'CentOS 7.0 or higher' },
    { id: 'centos6.0', name: 'CentOS 6.0 or higher' },
    { id: 'centos6.1', name: 'CentOS 6.0 or higher' },
    { id: 'centos6.2', name: 'CentOS 6.0 or higher' },
    { id: 'centos6.3', name: 'CentOS 6.0 or higher' },
    { id: 'centos6.4', name: 'CentOS 6.0 or higher' },
    { id: 'fedora31', name: 'Fedora 29 or higher' },
    { id: 'fedora30', name: 'Fedora 29 or higher' },
    { id: 'fedora29', name: 'Fedora 29 or higher' },
    { id: 'win10', name: 'Microsoft Windows 10' },
    { id: 'opensuse15.0', name: 'openSUSE 15' },
    { id: 'rhel8', name: 'Red Hat Linux 8' },
    { id: 'rhel7', name: 'Red Hat Linux 7' },
    { id: 'rhel6', name: 'Red Hat Linux 6' },
    { id: 'ubuntu18.04', name: 'Ubuntu 17 or higher' },
    { id: 'ubuntu17.10', name: 'Ubuntu 17 or higher' },
    { id: 'ubuntu17.04', name: 'Ubuntu 17 or higher' },
  ];

  const osWithoutDups: OperatingSystemRecord[] = [
    { id: 'centos8.0', name: 'CentOS 8.0 or higher' },
    { id: 'centos7.10', name: 'CentOS 7.0 or higher' },
    { id: 'centos6.4', name: 'CentOS 6.0 or higher' },
    { id: 'fedora31', name: 'Fedora 29 or higher' },
    { id: 'win10', name: 'Microsoft Windows 10' },
    { id: 'opensuse15.0', name: 'openSUSE 15' },
    { id: 'rhel8', name: 'Red Hat Linux 8' },
    { id: 'rhel7', name: 'Red Hat Linux 7' },
    { id: 'rhel6', name: 'Red Hat Linux 6' },
    { id: 'ubuntu18.04', name: 'Ubuntu 17 or higher' },
  ];

  it('remove duplicate records with the same name leaving the id with the highest version', () => {
    expect(_.sortBy(removeOSDups(osWithDups), ['id'])).toEqual(_.sortBy(osWithoutDups, ['id']));
  });
});
