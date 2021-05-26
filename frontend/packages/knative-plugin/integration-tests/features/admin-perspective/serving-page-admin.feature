@knative-admin @regression
Feature: Serving page at Administrator perspective
              As a user, I should be able to access KSVC, it's revisions and routes at Administrator perspective


        Background:
            Given user is at administrator perspective
              And user has installed OpenShift Serverless Operator
              And user has created or selected namespace "aut-serving-page"


        Scenario: Create new KSVC using Create button on Serving page: KA-04-TC01
            Given user is at Serving page
             When user clicks on Create button
              And user clicks on Service button
              And user clicks on Create button
             Then user will be redirected to Service Details page
              And user can see "sample" knative service created


        Scenario: Services tab on Serving page: KA-04-TC02
            Given user is at Serving page
              And user has created knative service "hello-openshift"
             When user clicks on Services tab
             Then user will see Search by name field
              And user can see knative service name "hello-openshift"
              And user can see titles URL, Generation, Created, Conditions, Ready, Reason
              And user can see kebab button


        Scenario: Revisions tab on Serving page: KA-04-TC03
            Given user is at Serving page
              And user has created knative service "hello-openshift"
             When user clicks on Revisions tab
             Then user will see Search by name field
              And user can see knative service name "hello-openshift"
              And user can see titles Namespace, Service, Created, Conditions, Ready, Reason
              And user can see kebab button


        Scenario: Routes tab on Serving page: KA-04-TC04
            Given user is at Serving page
              And user has created knative service "hello-openshift"
             When user clicks on Routes tab
             Then user will see Search by name field
              And user can see knative service name "hello-openshift"
              And user can see titles URL, Created, Conditions, Traffic
              And user can see kebab button
