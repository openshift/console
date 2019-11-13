#!/bin/bash

CONSOLE_URL=$(oc get console.config.openshift.io cluster --template '{{.status.consoleURL}}')
if [ -z "${CONSOLE_URL}" ]
then
  echo "no console_url, are you connected to a cluster?"
  exit 1
fi

# need to format the console_url for s_client
CONSOLE_URL_WITHOUT_HTTP=${CONSOLE_URL#"https://"}
SERVER="${CONSOLE_URL_WITHOUT_HTTP}:443"

ROUTER_CA=$(oc get configmap router-ca -n openshift-config-managed -o json | jq -r '.data["ca-bundle.crt"]')
echo "$ROUTER_CA" > /tmp/router-ca-file.txt

# CIPHER=ECDHE-ECDSA-CHACHA20-POLY1305 # DENIED
VALID_CIPHER_SAMPLE=(
  ECDHE-RSA-AES128-GCM-SHA256
  ECDHE-RSA-AES256-GCM-SHA384
)

for CIPHER in "${VALID_CIPHER_SAMPLE[@]}"
do
  RESULT=$(openssl s_client -connect "${SERVER}" -cipher "${CIPHER}" -CAfile /tmp/router-ca-file.txt 2>&1)
  if [[ $? -eq 0 ]]
  then
    echo "valid cipher was correctly accepted (${CIPHER})"
  else    
    echo "valid cipher suite was denied (${CIPHER})"
    exit 1
  fi
done 


# ensure we ignore weak ciphers
# CBC (cipher block chaining) are no longer reliable and should not be used
# CBC ciphers use an IV (initialization vector) and a chaining mechanism.
# The chaining mechanism means that a single bit error in a ciphertext block
# will invalidate all previous blocks.  The chaining was good in that it hides
# plaintext patterns, but is inferior to other cipher modes.
INVALID_CIPHER_SAMPLE=(
  RSA-AES-128-CBC-SHA256
  ECDHE-RSA-3DES-EDE-CBC-SHA    # disabled to mitigate SWEET32 attack
  RSA-3DES-EDE-CBC-SHA          # disabled to mitigate SWEET32 attack
)

for CIPHER in "${INVALID_CIPHER_SAMPLE[@]}"
do
  RESULT=$(openssl s_client -connect "${SERVER}" -cipher "${CIPHER}" -CAfile /tmp/router-ca-file.txt 2>&1)
  if [[ $? -eq 0 ]]
  then
    echo "invalid cipher suite used to connect to console (${CIPHER})"  
    exit 1  
  else    
    echo "invalid cipher was correctly denied (${CIPHER})"
  fi
done