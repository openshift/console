#!/bin/sh 

# default ENV 
NAME_NS="console-system"
file_Dir="./deployments"
temp_Dir="./deployments_temp"
crd_temp="$temp_Dir/1.crd.yaml"
init_temp="$temp_Dir/2.init.yaml"
job_temp="$temp_Dir/3.job.yaml"
svc_temp="$temp_Dir/4.svc-lb.yaml"
deploy_temp="$temp_Dir/5.deploy.yaml"
# KIBANA="opendistro-kibana.efk.svc.cluster.local:5601"
KIBANA="kibana.kube-logging.svc.cluster.local:5601"

# GET ENV 
# image version 
# OPERATOR_VER=$OPERATOR_VER  # OPERATOR_VER="latest"
CONSOLE_VER=$CONSOLE_VER    # CONSOLE_VER="0.5.1.32"
# Necessary to auth 
REALM=$REALM                # REALM="tmax"
KEYCLOAK=$KEYCLOAK          # KEYCLOAK="hyperauth.org"
CLIENTID=$CLIENTID          # CLIENTID="ck-integration-hypercloud5"
# true = multi cluster mode, false = single cluster mode
MC_MODE=$MC_MODE            # MC_MODE="true"

echo "==============================================================="
echo "STEP 1. ENV Setting"
echo "==============================================================="

KIALI_IP=$(kubectl get ingress -A -o jsonpath='{.items[?(@.metadata.namespace=="istio-system")].status.loadBalancer.ingress[0].ip}')
KIALI_PORT="" # default https port = 433 
if [ -z $KIALI_IP ]; then
    echo "Cannot find Ingress KIALI_IP in istio-system. Is kiali installed on Ingress?"
    KIALI_IP="0.0.0.0"
    KIALI_PORT="20001"
    echo "KIALI_IP dummy value temporarily set to 0.0.0.0:20001."
fi
KIALI=${KIALI_IP}:${KIALI_PORT}
echo "kiali Addr = ${KIALI}"

echo "kibana Addr = ${KIBANA} <- default"

# Inject ENV into yaml 
rm -rf $temp_Dir
cp -r $file_Dir $temp_Dir

# sed -i "s%@@OPERATOR_VER@@%${OPERATOR_VER}%g" ${deploy_temp}
sed -i "s%@@CONSOLE_VER@@%${CONSOLE_VER}%g" ${deploy_temp}

sed -i "s%@@CLIENTID@@%${CLIENTID}%g" ${deploy_temp}
sed -i "s%@@KEYCLOAK@@%${KEYCLOAK}%g" ${deploy_temp}
sed -i "s%@@REALM@@%${REALM}%g" ${deploy_temp}

sed -i "s%@@MC_MODE@@%${MC_MODE}%g" ${deploy_temp}

sed -i "s%@@KIALI@@%${KIALI}%g" ${deploy_temp}
sed -i "s%@@KIBANA@@%${KIBANA}%g" ${deploy_temp}

echo "==============================================================="
echo "STEP 2. Install console"
echo "==============================================================="
# Create CRD 
kubectl apply -f ${crd_temp}
# Create NS, SA, CRB, CR
kubectl apply -f ${init_temp}
# Create TLS Secret 
kubectl apply -f ${job_temp}
# Create Service (Load-Balancer Type)
kubectl apply -f ${svc_temp}
# Create Deploy 
kubectl apply -f ${deploy_temp}

echo "==============================================================="
echo "STEP 3. Is Console-pod Running??"
echo "==============================================================="
count=0
stop=20
while :
do
    sleep 1
    count=$(($count+1))
    echo "Waiting for $count sec(s)..."
    kubectl get po -l app=console -n ${NAME_NS} 
    RUNNING_FLAG=$(kubectl get po -n ${NAME_NS} -l app=console | grep console | awk '{print $3}')
    if [ ${RUNNING_FLAG} = "Running" ]; then
        echo "Console has been successfully deployed."
        # rm -rf ${temp_Dir}
        kubectl get svc -n ${NAME_NS}
        break 
    fi
    if [ $count -eq $stop ]; then 
        echo "It seems that something went wrong! Check the log."
        echo "==============================================================="
        echo "console log"
        echo "==============================================================="
        kubectl logs -n ${NAME_NS} $(kubectl get po -n ${NAME_NS} -l app=console | grep console | awk '{print $1}') console
        
        echo "==============================================================="
        echo "operator log"
        echo "==============================================================="
        kubectl logs -n ${NAME_NS} $(kubectl get po -n ${NAME_NS} -l app=console | grep console | awk '{print $1}') manager
        break
    fi
done
