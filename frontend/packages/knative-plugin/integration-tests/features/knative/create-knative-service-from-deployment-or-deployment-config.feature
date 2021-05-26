@knative, @odc-5055
Feature: Create Knative service from existing Deployment/Deployment Config workloads
              As a user, I should be able to create a serverless app(knative service) from existing deployment/deployment-config and specify any advanced options which I'm able to specify upon creating a knative service

        Background:
            Given user has created or selected namespace "aut-deployment-knative"


        @regression
        Scenario: Create serverless workload (ksvc) for existing Deployment from Action menu: KN-04-TC01
            Given user has created deployment workload "nodejs-ex-git1"
              And user is at Topology page
             When user clicks on "nodejs-ex-git1" to open sidebar
              And user selects "Make Serverless" option from Action menu
              And user clicks on Create button in Make Serverless form
             Then user will be redirected to topology with knative workload "ksvc-nodejs-ex-git1"


        @regression
        Scenario: Create serverless workload (ksvc) for existing Deployment Config from context menu: KN-04-TC02
            Given user has created deployment workload "nodejs-ex-git2"
              And user is at Topology page
             When user right clicks on "nodejs-ex-git1" to open context menu
              And user selects Make Serverless option
              And user clicks on Create button in Make Serverless form
             Then user will be redirected to topology with knative workload "ksvc-nodejs-ex-git2"


        @regression
        Scenario: Create serverless workload (ksvc) for existing Deployment from kebab menu of Deployments page: KN-04-TC03
            Given user has created deployment workload "nodejs-ex-git1"
              And user is at Deployments page
             When user clicks on kebab button "nodejs-ex-git1" to open kebab menu
              And user selects Make Serverless option
              And user clicks on Create button in Make Serverless form
             Then user will be redirected to topology with knative workload "ksvc-nodejs-ex-git1"


        @regression
        Scenario: Create serverless workload (ksvc) for existing Deployment from context menu whose Route is not defined: KN-04-TC04
            Given user has created deployment workload "hello-openshift1" with no Route defined
              And user is at Topology page
             When user right clicks on "hello-openshift1" to open context menu
              And user selects Make Serverless option
              And user clicks on Create button in Make Serverless form
             Then user will be redirected to topology with knative workload "ksvc-hello-openshift1"
              And user can see Routes available in the Resources tab of sidebar for knative workload "ksvc-hello-openshift1"


        @smoke
        Scenario: Edit knative workload created from deployment: KN-04-TC05
            Given user has created deployment workload "nodejs-ex-git1" from Import from Git way
              And user has created knative workload "ksvc-nodejs-ex-git1" from deployment "nodejs-ex-git1"
              And user is at Topology page
             When user right clicks on "ksvc-nodejs-ex-git1" to open context menu
              And user selects Edit ksvc-nodejs-ex-git1 option
              And user clicks on Scaling in Advanced option of Import from Git form
              And user scales value of Concurrency utilization to 4
              And user clicks on Save button
              And user right clicks on the knative service workoad "ksvc-nodejs-ex-git1" in Topology page
              And user selects option Edit service from the context menu
             Then user is able to see value of "autoscaling.knative.dev/targetUtilizationPercentage" as 4


        @regression
        Scenario: Create serverless workload (ksvc) for existing Deployment having HPA associated with it from context menu: KN-04-TC06
            Given user has created deployment workload "nodejs-ex-git2"
              And user has added HPA with Min and Max pod value as 3 and 6 respectively
              And user is at Topology page
             When user right clicks on "nodejs-ex-git1" to open context menu
              And user selects Make Serverless option
              And user clicks on Create button in Make Serverless form
              And user user right clicks on newly created knative workload "ksvc-nodejs-ex-git2"
              And user selects "Edit Service" option from context menu
             Then user is able to see the value of "autoscaling.knative.dev/maxScale" and "autoscaling.knative.dev/minScale" as 6 and 3 percent respectively
              And user is able to see 3 Pods running in Resources tab of sidebar for knative workload "ksvc-nodejs-ex-git2"

