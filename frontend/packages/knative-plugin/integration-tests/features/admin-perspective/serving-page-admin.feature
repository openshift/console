@knative-admin @knative
Feature: Serving page at Administrator perspective
              As a user, I should be able to access KSVC, it's revisions and routes at Administrator perspective


        Background:
            Given user has created or selected namespace "aut-serving-page"
              And user has created knative service "hello-openshift" in admin
              And user is at administrator perspective


        @regression
        Scenario: Create new KSVC using Create button on Serving page: KA-04-TC01
            Given user is at Serving page
             When user clicks on Create dropdown button
              And user clicks on Service button
              And user clicks on Create button to create service
             Then user will be redirected to Service Details page
              And user can see "showcase" knative service created


        @regression
        Scenario: Services tab on Serving page: KA-04-TC02
            Given user is at Serving page
             When user clicks on Services tab
             Then user will see Search by name field
              And user can see knative service name "hello-openshift"
              And user can see titles URL, Revision, Created, Conditions, Ready, Reason
              And user can see kebab button


        @regression
        Scenario: Revisions tab on Serving page: KA-04-TC03
            Given user is at Serving page
             When user clicks on Revisions tab
             Then user will see Search by name field
              And user can see knative service name "hello-openshift"
              And user can see titles Namespace, Service, Created, Conditions, Ready, Reason
              And user can see kebab button


        @regression
        Scenario: Routes tab on Serving page: KA-04-TC04
            Given user is at Serving page
             When user clicks on Routes tab
             Then user will see Search by name field
              And user can see knative service name "hello-openshift"
              And user can see titles URL, Created, Conditions, Traffic
              And user can see kebab button
