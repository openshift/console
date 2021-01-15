echo "Registering CRD's on cluster"

oc apply -n openshift -f ./crds/ManagedKafkaConnection.yml       
oc apply -n openshift -f  ./crds/ManagedKafkaRequest.yml          
oc apply -n openshift -f  ./crds/ManagedServiceAccountRequest.yml

echo "Plugin can be used now. Create ManagedKafkaRequest CR"
