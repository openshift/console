# OCS UI Features

The OCS UI requires some annotations in the OCS Operator CSV to perform various actions.

Following table maps the annotation to its use case and accepted values:
|Annotation Name|Purpose|Accepted Values |
|---------------------------------------|---------------------------|--------|
| `features.ocs.openshift.io/enabled`| Activate UI Features | "external", "snapshot" |
| `external.features.ocs.openshift.io/validation`| Mininum required keys to be supplied by the admin to connect to an external cluster | Array of Keys that need to be validated in UI |
||||

## Enabling Features in UI

UI features are activated based on the values in `features.ocs.openshift.io/enabled` annotation. The following table maps a feature and the respective annotation required to activate it.
| Feature |Feature guard|
|------------------------------|------------|
| External Cluster Installation| `external` |
| Volume Snapshots| `snapshot`

#### Example

       "features.ocs.openshift.io/enabled": `["external"]`

## JSON validation (Independent Mode)

This is used to perform validation of the JSON file uploaded by the user during Independent mode installation. The values in `external.ocs.openshift.io/validation` annotation needs to be a stringified JSON. The JSON object should have the following keys and values:
| Key | Accepted Values | Validation Performed |
|------|-----------|-------------|
| `secrets` | Array of String| JSON should contain all the `secrets` defined in the array. The `data.userKey` /`data.adminKey` field should be Base64 encoded and non-empty.
|`configMaps`| Array of String| JSON should contain all the `configMaps` defined in the array. `data` field should be non-empty.
| `storageClasses`| Array of String| JSON should contain all the `storageClasses` defined in the array. `data` field should be non-empty.

#### Example (CSV Annotataton)

    external.features.ocs.openshift.io/validation: '{"secrets":["rook-ceph-operator-creds",

    "rook-csi-rbd-node", "rook-csi-rbd-provisioner", "rook-csi-cephfs-node", rook-csi-cephfs-provisioner"],

    "configMaps": ["rook-ceph-mon-endpoints", "rook-ceph-mon"], "storageClasses":

    ["rook-ceph-retain-bucket"]}'

#### Example (User Uploaded JSON)

Excerpt of the JSON uploaded by the user.

    [
    	{
    		"kind": "ConfigMap",
    		"data": {
    			"maxMonId": "0",
    			"data": "a=10.106.31.93:6789",
    			"mapping": {}
    		},
    		"name": "rook-ceph-mon-endpoints"
    	},
    	{
    		"kind": "Secret",
    		"data": {
    			"userKey": "AQBI8bteZd52HxAAAgHS3TJGEfgZurN+gVvDNQ==",
    			"userID": "client.aaaa"
    		},
    		"name": "rook-ceph-operator-creds"
    	},
    	{
    		"kind": "Secret",
    		"data": {
    			"adminID": "csi-cephfs-provisioner",
    			"adminKey": "AQBV66pefnqmERAAKYhoO2XK5mUIGKSN4J/URw=="
    		},
    		"name": "rook-csi-cephfs-provisioner"
    	},
    	{
    		"kind": "StorageClass",
    		"data": {
    			"pool": "device_health_metrics"
    		},
    		"name": "ceph-rbd"
    	},
    ]
