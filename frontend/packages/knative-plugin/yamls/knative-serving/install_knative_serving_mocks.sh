echo -e "\e[1m \e[100m \e[94m ======================================== \e[97m \e[49m"
echo -e "\e[100m \e[94m   WELCOME TO Knative Serving MOCK INSTALLER  \e[97m \e[49m"
echo -e "\e[100m \e[94m   Make sure Service Mesh Operator is installed  \e[97m \e[49m"
echo -e "\e[100m \e[94m   Make sure OpenShift Serverless Operator is installed  \e[97m \e[49m"
echo -e "\e[100m \e[94m   Docs: https://docs.openshift.com/container-platform/4.1/serverless/installing-openshift-serverless.html  \e[97m \e[49m"
echo -e "\e[100m \e[94m==   -  STEP 1/5 -   == \e[97m \e[49m"
echo -e "\e[32m  -  Cleanup process  -  \e[97m"
oc delete -f smcp.yaml
oc delete -f smmr.yaml
oc delete -f serving.yaml
sleep 5
echo -e "\e[100m \e[94m==   -  STEP 2/5 -   == \e[97m \e[49m"
echo -e "\e[32m  - SETTING ENVIRONMENT NAMESPACE CONTROLLERS  - \e[97m"
oc new-project serverless-test
sleep 5
oc new-project istio-system
echo -e "\e[32m - In the installation process!! THIS SHOULD TAKE 4-5 MINUTES  - \e[97m"
oc apply -f smcp.yaml
sleep 300
echo -e "\e[32m - watch the progress of the pods during the installation process!! - \e[97m"
oc get pods -n istio-system
echo -e "\e[100m \e[94m==   -  STEP 3/5 -   == \e[97m \e[49m"
echo -e "\e[32m - Installing a ServiceMeshMemberRoll  - \e[97m"
oc apply -f smmr.yaml
echo -e "\e[100m \e[94m==   -  STEP 4/5 -   == \e[97m \e[49m"
echo -e "\e[32m  -  Installing a ServiceMeshMemberRoll  -  \e[97m"
sleep 15
oc apply -f serving.yaml
echo -e "\e[100m \e[94m==   -  STEP 5/5 -   == \e[97m \e[49m"
echo -e "\e[32m -  Installing Knative Serving!! THIS SHOULD TAKE 1-2 MINUTES - \e[97m"
sleep 120
oc get knativeserving/knative-serving -n knative-serving --template='{{range .status.conditions}}{{printf "%s=%s\n" .type .status}}{{end}}'
echo -e "\e[100m \e[94m   DONE !! ENJOY YOUR DAY !! DEV CONSOLE UI  \e[97m \e[49m"
echo -e "\e[100m \e[94m ======================================== \e[97m \e[49m \e[0m"
