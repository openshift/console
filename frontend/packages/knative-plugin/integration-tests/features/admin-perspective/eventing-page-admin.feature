@knative-admin @knative @broken-test
# Broken due to https://issues.redhat.com/browse/OCPBUGS-55368
Feature: Eventing page at Administrator perspective
              As a user, I should be able to access event sources, channels, brokers at Administrator perspective


        Background:
            Given user has created or selected namespace "aut-eventing-page"
              And user is at administrator perspective


        @regression
        Scenario: Create new Event Source: KA-01-TC01
            Given user has created knative service "hello-openshift" in admin
              And user is at administrator perspective
              And user is at eventing page
             When user clicks on Create dropdown button
              And user selects Event Source
              And user clicks on Ping Source
              And user enters "Message" in Data field
              And user enters "* * * * *" in Schedule field
              And user selects resource "hello-openshift"
              And user clicks on Create button to submit
             Then user will be redirected to Topology page
              And ApiServerSource event source "ping-source" is created and linked to selected knative service "hello-openshift"


        @regression
        Scenario: Create new Channel: KA-01-TC02
            Given user is at eventing page
             When user clicks on Create dropdown button
              And user selects Channel
              And user selects Default channels
              And user clicks on Create button to create channel
             Then user will be redirected to Topology page
              And user will see the channel "channel" created


        @manual
        Scenario: Broker Details page: KA-01-TC03
            Given user is at eventing page
              And user has created Broker "example"
              And user has created trigger subscribing to knative service newly created "hello-openshift"
              And user click on broker "example" in broker tab
             Then user will shown with Broker Details page
              And user will see Details tab with Broker Details
              And user will see YAML generated for Broker under YAML tab
              And user will see Broker name and Subscriber name under Triggers tab


        @manual
        Scenario: Trigger Details page: KA-01-TC04
            Given user is at eventing page
              And user has created Broker "example"
              And user has created trigger subscribing to knative service newly created "hello-openshift"
              And user is at Trigger Details page
             Then user will see Details tab with Trigger Details
              And user will see YAML generated for Trigger under YAML tab


        @manual
        Scenario: Channel Details page: KA-01-TC05
            Given user is at eventing page
              And user has created channel "example"
              And user has created trigger subscribing to knative service newly created "hello-openshift"
              And user is at Channel Details page
             Then user will see Details tab with Channel Details
              And user will see YAML generated for Channel under YAML tab
              And user will see Channel name and Subscriber name under Subscriptions tab


        @manual
        Scenario: Subscription Details page: KA-01-TC06
            Given user is at eventing page
              And user has created channel "example"
              And user has created trigger subscribing to knative service newly created "hello-openshift"
              And user is at Subscription Details page
             Then user will see Details tab with Subscription Details
              And user will see YAML generated for Subscription under YAML tab
