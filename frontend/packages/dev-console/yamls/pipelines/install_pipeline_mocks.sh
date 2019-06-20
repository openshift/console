echo -e "\e[1m \e[100m \e[94m ======================================== \e[97m \e[49m"
echo -e "\e[100m \e[94m   WELCOME TO PIPELINE MOCK INSTALLER  \e[97m \e[49m"
echo -e "\e[100m \e[94m==   -  STEP 1/5 -   == \e[97m \e[49m"
echo -e "\e[32m  - SETTING ENVIRONMENT NAMESPACE CONTROLLERS and WEBHOOKS - \e[97m"
oc create namespace tekton-pipelines
oc project tekton-pipelines
oc delete -f base.yaml
oc delete -f resources.yaml
oc create -f base.yaml
echo -e "\e[100m \e[94m==   -  STEP 2/5 -   == \e[97m \e[49m"
echo -e "\e[32m - CREATING PIPELINE-RESOURCES!! THIS SHOULD TAKE 11-15 SECONDS - \e[97m"
sleep 10
oc create -f resources.yaml
echo -e "\e[100m \e[94m==   -  STEP 3/5 -   == \e[97m \e[49m"
echo -e "\e[32m - CREATING TASKS  - \e[97m"
sleep 1
oc create -f task.yaml
echo -e "\e[100m \e[94m==   -  STEP 4/5 -   == \e[97m \e[49m"
echo -e "\e[32m  -  CREATING PIPELINES  -  \e[97m"
sleep 1
oc create -f pipeline.yaml
echo -e "\e[100m \e[94m==   -  STEP 5/5 -   == \e[97m \e[49m"
echo -e "\e[32m -  CREATING PIPELINERUNS!! THIS SHOULD TAKE 9-13 SECONDS  - \e[97m"
sleep 8
oc create -f pipelinerun.yaml
echo -e "\e[100m \e[94m   DONE !! ENJOY YOUR DAY !! DEV CONSOLE UI  \e[97m \e[49m"
echo -e "\e[100m \e[94m ======================================== \e[97m \e[49m \e[0m"
sleep 3
