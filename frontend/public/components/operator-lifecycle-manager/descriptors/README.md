# Operator Descriptors

The Operator Lifecycle Manager allows adding descriptors to Custom Resource Definitions, which are used to describe different fields on the object and actions that can be peformed.

There are three types of descriptors:

Type   | Directory | Description
-------|-----------|------------
Spec   | `spec/`   | References fields in the `spec` block of an object
Status | `status/` | References fields in the `status` block of an object
Action | `action/` | References actions that can be performed on an object

The schema for a descriptor is the same, regardless of type:

```typescript
type Descriptor = {
  path: string; // Dot-delimited path of the field on the object that this descriptor 
  displayName: string;
  description: string;
  'x-descriptors': SpecCapability[] | StatusCapability[]; // Used to determine which "capabilities" this descriptor has, and which React component to use
  value?: any; // Optional value 
}
```

### Example

From the `ClusterServiceVersion` for [etcd-operator](https://github.com/operator-framework/operator-lifecycle-manager/blob/master/deploy/chart/catalog_resources/ocs/etcdoperator.v0.9.2.clusterserviceversion.yaml):

```yaml
- name: etcdclusters.etcd.database.coreos.com
  version: v1beta2
  kind: EtcdCluster
  displayName: etcd Cluster
  description: Represents a cluster of etcd nodes.
  resources:
    - kind: Service
      version: v1
    - kind: Pod
      version: v1
  specDescriptors:
    - description: The desired number of member Pods for the etcd cluster.
      displayName: Size
      path: size
      x-descriptors:
        - 'urn:alm:descriptor:com.tectonic.ui:podCount'
    - description: Limits describes the minimum/maximum amount of compute resources required/allowed
      displayName: Resource Requirements
      path: pod.resources
      x-descriptors:
        - 'urn:alm:descriptor:com.tectonic.ui:resourceRequirements'
  statusDescriptors:
    - description: The status of each of the member Pods for the etcd cluster.
      displayName: Member Status
      path: members
      x-descriptors:
        - 'urn:alm:descriptor:com.tectonic.ui:podStatuses'
```

Which yields this UI:

![screenshot_20180821_163304](https://user-images.githubusercontent.com/11700385/44427562-eb1fb500-a55f-11e8-83e5-98e7008dabdb.png)

## Contributing

To add a new React component associated with a spec/status descriptor, make a pull request against this repo that satisfies the following requirements:

1. Make a React component that accepts props of type `DescriptorProps` and renders the spec/status value.
  - Place component in its own module in either the `spec`, `status`, or `action` directory
  - Ensure that empty values and errors are properly handled
2. Add a new "capability" URN to the `SpecCapability`/`StatusCapability` enum.
3. Update the `capabilityComponents` map with the capability/component key-value pair.

### Testing

All new descriptor components must have both unit and end-to-end tests. Frameworks and idiomatic examples of both exist in the codebase already and should be followed.

#### Unit Tests

Located at `frontend/__tests__/components/operator-lifecycle-manager/descriptors`.
Add a corresponding unit test file (named `<module>.spec.tsx`) that imports your component and provides sufficient coverage.

```shell
$ yarn run test
```

#### E2E Tests

Located at `frontend/integration-tests/tests/olm`.
To sufficiently test your component, modify `descriptors.scenario.ts` and add a new case to `defaultValueFor` to provide a default value for your descriptor.

Run the OLM end-to-end tests against a cluster with OLM installed:

```shell
$ yarn run test-suite --suite olm
```
