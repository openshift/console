import {
  getAccessModeForProvisioner,
  getProvisionerModeMapping,
  getVolumeModeForProvisioner,
  initialAccessModes,
} from '../shared';

describe('storage shared helpers', () => {
  describe('getAccessModeForProvisioner', () => {
    const accessModeCases: {
      description: string;
      provisioner: string;
      ignoreReadOnly?: boolean;
      volumeMode?: string;
      expected: string[];
    }[] = [
      {
        description: 'includes ReadWriteOncePod for Cinder CSI Filesystem',
        provisioner: 'cinder.csi.openstack.org',
        ignoreReadOnly: false,
        volumeMode: 'Filesystem',
        expected: ['ReadWriteOnce', 'ReadWriteOncePod'],
      },
      {
        description: 'includes ReadWriteOncePod for Cinder CSI Block',
        provisioner: 'cinder.csi.openstack.org',
        ignoreReadOnly: false,
        volumeMode: 'Block',
        expected: ['ReadWriteOnce', 'ReadWriteOncePod'],
      },
      {
        description: 'includes ReadWriteOncePod for in-tree Cinder without duplicates',
        provisioner: 'kubernetes.io/cinder',
        ignoreReadOnly: false,
        volumeMode: 'Filesystem',
        expected: ['ReadWriteOnce', 'ReadWriteOncePod'],
      },
      {
        description: 'does not enable RWOP for Manila CSI',
        provisioner: 'manila.csi.openstack.org',
        expected: ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany'],
      },
      {
        description: 'filters ReadOnlyMany when ignoreReadOnly is true',
        provisioner: 'manila.csi.openstack.org',
        ignoreReadOnly: true,
        volumeMode: 'Filesystem',
        expected: ['ReadWriteOnce', 'ReadWriteMany'],
      },
      {
        description: 'falls back to initialAccessModes for unknown provisioners',
        provisioner: 'unknown.provisioner.example',
        expected: initialAccessModes,
      },
    ];

    accessModeCases.forEach(
      ({ description, provisioner, ignoreReadOnly, volumeMode, expected }) => {
        it(description, () => {
          expect(getAccessModeForProvisioner(provisioner, ignoreReadOnly, volumeMode)).toEqual(
            expected,
          );
        });
      },
    );

    it('does not offer RWX or ROX for Cinder CSI', () => {
      const modes = getAccessModeForProvisioner('cinder.csi.openstack.org');
      expect(modes).toEqual(['ReadWriteOnce', 'ReadWriteOncePod']);
      expect(modes).not.toContain('ReadWriteMany');
      expect(modes).not.toContain('ReadOnlyMany');
    });
  });

  describe('getProvisionerModeMapping', () => {
    it('returns Filesystem and Block mappings for Cinder CSI including RWOP', () => {
      expect(getProvisionerModeMapping('cinder.csi.openstack.org')).toEqual({
        Filesystem: ['ReadWriteOnce', 'ReadWriteOncePod'],
        Block: ['ReadWriteOnce', 'ReadWriteOncePod'],
      });
    });

    it('does not duplicate ReadWriteOncePod for in-tree Cinder', () => {
      expect(getProvisionerModeMapping('kubernetes.io/cinder')).toEqual({
        Filesystem: ['ReadWriteOnce', 'ReadWriteOncePod'],
        Block: ['ReadWriteOnce', 'ReadWriteOncePod'],
      });
    });
  });

  describe('getVolumeModeForProvisioner', () => {
    it('allows Filesystem and Block for Cinder CSI with ReadWriteOncePod', () => {
      expect(getVolumeModeForProvisioner('cinder.csi.openstack.org', 'ReadWriteOncePod')).toEqual([
        'Filesystem',
        'Block',
      ]);
    });
  });
});
