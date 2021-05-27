Feature: Operators
              As a user I want to install or uninstall the operators

        Background:
            Given user is at administrator perspective


        @regression @to-do
        Scenario: OpenShift Pipeline operator subscription page : C-01-TC01
            Given user is at Operator Hub page with the header name "OperatorHub"
             When user searches for "OpenShift Pipelines Operator"
              And user clicks OpenShift Pipelines Operator card on Operator Hub page
              And user clicks install button present on the right side bar
             Then OpenShift Pipeline operator subscription page will be displayed


        @smoke @to-do
        Scenario: Install the Pipeline Operator from Operator Hub page : C-01-TC02
            Given user executed command "oc apply -f https://gist.githubusercontent.com/nikhil-thomas/f6069b00b0e3b0359ae1cbdb929a04d6/raw/7b19be0c52355d041bf3d6a883db06b578f15f0d/openshift-pipelines-early-release-catalog-source.yaml"
              And user is at OpenShift Pipeline Operator subscription page
             When user installs the pipeline operator with default values
             Then user will see a modal with title "OpenShift Pipelines Operator"
              And user will see a View Operator button


        @smoke @to-do
        Scenario: Install the Serverless Operator from Operator Hub page : C-01-TC03
            Given user is at OpenShift Serverless Operator subscription page
             When user installs the OpenShift Serverless operator with default values
             Then user will see a modal with title "OpenShift Serverless Operator"
              And user will see a View Operator button
              And user will see serverless option on left side navigation menu


        @smoke @to-do
        Scenario: Install the knative eventing operator : C-01-TC04
            Given user has installed OpenShift Serverless Operator
              And user is on the knative-eventing namespace
             When user navigates to installed operators page in Admin perspective
              And user clicks knative eventing provided api pressent in knative serverless operator
              And user clicks Create knative Eventing button present in knative Eventing tab
              And user clicks create button
             Then Event sources card display in Add page in dev perspective


        @smoke @to-do
        Scenario: Install the knative apache camel operator : C-01-TC05
            Given user has installed OpenShift Serverless and eventing operator
              And user is at Operator Hub page with the header name "OperatorHub"
             When user search and installs the knative Camel operator with default values
             Then user will see a modal with title "knative Apache Camel Operator"
              And user will see a View Operator button


        @smoke @to-do
        Scenario: Install the dynamic event operator : C-01-TC06
            Given user has installed OpenShift Serverless Operator
             When user executes commands from cli as "kubectl apply -f https://github.com/knative/eventing-contrib/releases/download/v0.14.1/github.yaml"
              And user navigates to Add page
              And user clicks on "Event source" card
             Then user will be redirected to Event Sources page
              And GitHub Source is displayed in types section


        @smoke @to-do
        Scenario: Install the Che Operator from Operator Hub page : C-01-TC07
            Given user is at Eclipse che Operator subscription page
             When user installs the Eclipse che operator with default values
             Then user will see a modal with title "Eclipse Che"
              And user will see a View Operator button


        @smoke @to-do
        Scenario: Install OpenShift Virtualization Operator: C-01-TC08
            Given user is at Operator Hub page with the header name "OperatorHub"
              And user has selected namespace "openshift-cnv"
             When user searches for "OpenShift Virtualization"
              And user clicks on the OpenShift Virtualization Operator card
              And user clicks install button present on the right side bar
              And user installs the OpenShift Virtualization operator with default values
             Then user will see a modal with title "OpenShift Virtualization"
              And user will see a View Operator button


        @smoke @to-do
        Scenario: Create OpenShift Virtualization Deployment: C-01-TC09
            Given user has installed OpenShift Virtualization Operator
              And user is at Installed Operator page
             When user clicks on OpenShift Virtualization Operator
              And user clicks on OpenShift Virtualization Deployment tab
              And user clicks on the Create HyperConverged button
              And user clicks on Create button
             Then user will see a HyperConverged type created


        @smoke @to-do
        Scenario: Create HostPathProvisioner Deployment: C-01-TC10
            Given user has installed OpenShift Virtualization Operator
              And user is at Installed Operator page
             When user clicks on OpenShift Virtualization Operator
              And user clicks on HostPathProvisioner Deployment tab
              And user clicks on the Create HostPathProvisioner button
              And user clicks on Create button
             Then user will see a HostPathProvisioner type created
              And user will see Virtualization item under Workloads


        @smoke @to-do
        Scenario: Quay container security operator: C-01-TC11
            Given user is at Operator Hub page with the header name "OperatorHub"
             When user searches for "quay container security"
              And user clicks on quay container security operator card on Operator Hub page
              And user clicks install button present on the right sidebar
              And user installs the quay container security operator with default values
             Then user will see a quay container security installing modal
              And user will see a View Operator button


        Scenario: Uninstall the knative serverless operator from Operator Hub page: C-01-TC12
            Given user is at OpenShift Serverless Operator subscription page


        @smoke @to-do
        Scenario: Install Web Terminal operator from Operator Hub page: C-01-TC13
            Given user is at Operator Hub page with the header name "OperatorHub"
             When user searches for "Web Terminal"
              And user clicks on the Web Terminal Operator card
              And user clicks install button present on the right side bar
              And user installs the Web Terminal operator with default values
             Then user will see a modal with title "Web Terminal"
              And user will see a View Operator button


        @smoke @to-do
        Scenario: Install Red Hat Integration - Camel K Operator: C-01-TC14
            Given user has installed OpenShift Serverless Operator
              And user is at Operator Hub page with the header name "OperatorHub"
             When user searches and installs the Red Hat Integration - Camel K Operator with default values
             Then user will see a modal with title "Red Hat Integration - Camel K"
              And user will see a View Operator button


        @smoke @to-do
        Scenario: Create Integration Platform CR: C-01-TC15
            Given user has installed OpenShift Serverless Operator
              And user has installed Red Hat Integration - Camel K Operator
              And user has selected "aut-test-kamelets" namespace
              And user is on Installed Operator page
             When user clicks on Integration Platform link
              And user clicks on Create IntegrationPlatform button
              And user clicks on Create button
             Then user will be redirected to Integration Platform tab with header "IntegrationPlatforms"
              And user will see Integration Platform created with name example


        @smoke @to-do
        Scenario: Install Sealed Secrets Operator: C-01-TC16
            Given user has created namespace "cicd"
              And user is at Operator Hub page with the header name "OperatorHub"
             When user searches for "Sealed Secrets Operator"
              And user clicks on the Sealed Secrets Operator card
              And user clicks install button present on the right side bar
              And user installs the Sealed Secrets Operator with default values
             Then user will see a modal with title "Sealed Secrets Operator"
              And user will see a View Operator button


        @smoke @to-do
        Scenario: Create SealedSecretController CR: C-01-TC17
            Given user has installed Sealed Secrets Operator
              And user has selected "cicd" namespace
              And user is on Installed Operator page
             When user clicks on SealedSecretController link
              And user clicks on Create SealedSecretController button
              And user enters name "sealedsecretcontroller"
              And user clicks on Create button
             Then user will be redirected to Sealed Secrets Controller tab with header "SealedSecretControllers"
              And user will see sealedsecretcontroller created with name sealedsecretcontroller


        @smoke @to-do
        Scenario: Install Argo CD Operator: C-01-TC18
            Given user has created namespace "argocd"
              And user is at Operator Hub page with the header name "OperatorHub"
             When user searches for "Argo CD"
              And user clicks on the Argo CD card
              And user clicks install button present on the right side bar
              And user installs the Argo CD Operator with default values
             Then user will see a modal with title "Argo CD Operator"
              And user will see a View Operator button


        #Run RHOAS-catalog-source.yaml from dev-console/integration-tests/testData/yamls/operator-installation folder to get redhat version of RHOAS operator
        @smoke @to-do
        Scenario: RHOAS operator: C-01-TC19
            Given user is at Operator Hub page
             When user searches for "RHOAS"
              And user clicks on RHOAS operator card on Operator Hub page
              And user clicks install button present on the right sidebar
              And user installs the RHOAS operator with default values
             Then user will see a RHOAS installing modal
              And user will see a View Operator button


        @smoke @to-do
        Scenario: Red Hat Integration - AMQ Streams operator: C-01-TC20
            Given user is at Operator Hub page
             When user searches for "Red Hat Integration - AMQ Streams"
              And user clicks on Red Hat Integration - AMQ Streams operator card on Operator Hub page
              And user clicks install button present on the right sidebar
              And user installs the Red Hat Integration - AMQ Streams operator with default values
             Then user will see a Red Hat Integration - AMQ Streams installing modal
              And user will see a View Operator button
