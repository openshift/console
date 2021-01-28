echo "Registering CRD's on cluster"

oc delete -n openshift crd ManagedKafkaConnection
oc delete -n openshift crd ManagedKafkaRequest
oc delete -n openshift crd ManagedServiceAccountRequest

oc apply -n openshift -f ./crds/ManagedKafkaConnection.yml
oc apply -n openshift -f  ./crds/ManagedKafkaRequest.yml
oc apply -n openshift -f  ./crds/ManagedServiceAccountRequest.yml

echo "Plugin can be used now. Create ManagedKafkaRequest CR"
