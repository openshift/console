# tectonic-stats-collector

This project encompasses two things:

1. collector: an HTTP API capable of receiving statistics payloads from Tectonic clusters and storing them in Postgres
2. generator: a tool that periodically generates statistics payloads using the v1 Kubernetes API and publishes it to the collector

An example of a statistics payload follows:

```
{
  "accountID": "238dcbc5-4562-4fe3-9d8b-dc67911a7376",
  "accountSecret": "dhaowd2n3ngsj3d-9",
  "metadata": {
    "generated_at": "1437174715",
  },
  "payload": {
    "clusterID":"612e0f99-1912-4647-831d-ba4c3d918b66",
    "kubernetesNodes":[
      {
        "status":{
          "capacity":{
            "cpu":"1",
            "memory":"505020Ki",
            "pods":"40"
          },
          "nodeInfo":{
            "osImage":"CoreOS 738.1.0",
            "kernelVersion":"4.0.7-coreos-r2",
            "kubeletVersion":"v1.0.3",
            "containerRuntimeVersion":"docker://1.6.2"
          }
        }
      }
    ]
  }
}
```

Note the `generated_at` metadata field - this is populated by the generator (but is not required).
The collector will add more fields to the record metadata when it is received:

- `received_at`: unix timestamp at which the record was received (i.e. "1437174812")
- `received_from`: `<host>[:port]` from which the record was received (i.e. 192.0.2.145)

## build & test

Simply run `./build` or `./test`.

Alternatively, run `./go-docker ./build` or `./go-docker ./test` to build a golang container and execute golang commands therein.

## release process

This project is built and released via [jenkins.coreos.systems](https://jenkins.coreos.systems/job/tectonic-stats-collector).
Jenkins builds are triggered manually for the time being.

### package & publish

Jenkins uses the `package` and `publish` scripts to automate the building and pushing of docker images containing the generator and collector.
Configure these scripts with `COLLECTOR_DOCKER_REPO`, `GENERATOR_DOCKER_REPO` and `DOCKER_TAG` environment variables before running them.
The user is expected to pre-authenticate the local docker client with access to the necessary repositories.

## deploy

See the Kubernetes manifest in contrib/ for examples of how to deploy the collector and generator.
Make sure that you provide the appropriate docker secrets!
