@knative-serverless @knative @broken-test
Feature: Create Knative service from existing Deployment/Deployment Config workloads
              As a user, I should be able to create a serverless app(knative service) from existing deployment/deployment-config and specify any advanced options which I'm able to specify upon creating a knative service

        Background:
            Given user has created or selected namespace "1aut-deployment-knative"


        @regression
        Scenario: Create serverless workload (ksvc) for existing Deployment from Action menu: KN-04-TC01
            Given user is at Add page
              And user has created a deployment workload "dep-workload"
              And workload "dep-worload" is present in topology page
              And user clicks on "dep-workload" to verify that build is completed
             When user clicks on "dep-workload" to open sidebar
              And user selects option "Make Serverless" from Actions menu drop down
              And user enters the Name as "sev-workload" in Make Serverless form
              And user clicks on Create button in Make Serverless form
             Then user is able to see 2 workloads "dep-workload" and "sev-workload"


        @regression
        Scenario: Create serverless workload (ksvc) for existing Deployment Config from context menu: KN-04-TC02
            Given user has created a deployment config workload "dc-workload"
              And user is at the Topology page
              And user clicks on "dc-workload" to verify that build is completed
             When user right clicks on the node "dc-workload" to open context menu
              And user selects option "Make Serverless" from context options
              And user enters the Name as "dc-workloadsev" in Make Serverless form
              And user clicks on Create button in Make Serverless form
             Then user will be redirected to topology with knative workload "dc-workloadsev"


        @regression
        Scenario: Create serverless workload (ksvc) for existing Deployment from kebab menu of Deployments page: KN-04-TC03
            Given user has created a deployment workload "nodejs-ex-git-d"
              And user is at the Topology page
              And user clicks on "nodejs-ex-git-d" to verify that build is completed
              And user is at Deployments page
             When user clicks on kebab button "nodejs-ex-git-d" to open kebab menu
              And user selects option "Make Serverless" from kebab options
              And user enters the Name as "nodejs-ex-git-dsev" in Make Serverless form
              And user clicks on Create button in Make Serverless form
             Then user will be redirected to topology with knative workload "nodejs-ex-git-dsev"


        @regression
        Scenario: Create serverless workload (ksvc) for existing Deployment from context menu whose Route is not defined: KN-04-TC04
            Given user has created deployment workload "hello-openshift" with no Route defined
              And user is at the Topology page
              And user clicks on "hello-openshift" to check pod is running
             When user right clicks on the node "hello-openshift" to open context menu
              And user selects option "Make Serverless" from context options
              And user enters the Name as "hello-openshift-sev" in Make Serverless form
              And user clicks on Create button in Make Serverless form
             Then user will be redirected to topology with knative workload "hello-openshift-sev"
              And user can see Routes available in the Resources tab of sidebar for knative workload "hello-openshift-sev"


        @smoke @broken-test
        Scenario: Edit knative workload created from deployment: KN-04-TC05
            Given user has created a deployment workload "nodejs-ex-git1"
              And user has created knative workload "nodejs-ex-git1-sev" from deployment "nodejs-ex-git1"
              And user is at the Topology page
             When user right clicks on the knative workload "nodejs-ex-git1-sev" to open the Context Menu
              And user selects option "Edit nodejs…t1-sev" from context options
              And user clicks on Scaling in Advanced option of Import from Git form
    #Bug: Can't change the values by typing in Concurrency utilization field - https://issues.redhat.com/browse/OCPBUGS-2306
              And user scales value of Concurrency utilization to '4'
              And user clicks on save button
              And user right clicks on the knative service workoad "nodejs-ex-git1-sev" in Topology page
              And user selects option "Edit Service" from context options
             Then user is able to see value of "autoscaling.knative.dev/targetUtilizationPercentage" as "4"


        @regression @broken-test
        Scenario: Create serverless workload (ksvc) for existing Deployment having HPA associated with it from context menu: KN-04-TC06
            Given user has created a deployment workload "nodejs-ex-git2" with CPU resource limit "100" and Memory resource limit "100"
    #Bug: Can't change the values by typing in max and min pod fields - https://issues.redhat.com/browse/OCPBUGS-2306
              And user has added HPA to workload "nodejs-ex-git2" with Min and Max pod value as "3" and "6" respectively with CPU and Memory utilisation values as "60" and "30" respectively
              And user is at the Topology page
              And user clicks on "nodejs-ex-git2" to verify that build is completed
             When user right clicks on the node "nodejs-ex-git2" to open context menu
              And user selects option "Make Serverless" from context options
              And user enters the Name as "nodejs-ex-git2-sev" in Make Serverless form
              And user clicks on Create button in Make Serverless form
              And user right clicks on the knative service workoad "nodejs-ex-git2-sev" in Topology page
              And user selects option "Edit Service" from context options
             Then user is able to see the value of "autoscaling.knative.dev/maxScale" and "autoscaling.knative.dev/minScale" as "6" and "3" percent respectively
              And user is able to see "3" Pods running in Resources tab of sidebar for knative workload "nodejs-ex-git2-sev"
