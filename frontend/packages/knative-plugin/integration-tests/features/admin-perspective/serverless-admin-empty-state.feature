@knative-admin @regression
Feature: Serving and Eventing pages at Administrator perspective
              As a user, Brokers, Channels and Event Sources must be easily accessible in the Admin perspective


        Background:
            Given user is at administrator perspective
              And user has created or selected namespace "aut-eventing-empty"


        Scenario: Empty state of Eventing page: KA-03-TC01
            Given user is at Eventing page
             Then user will see Create button
              And user will see "No Event Sources found" message on Event Sources tab
              And user will see "No Brokers found" message on Brokers tab
              And user will see "No Triggers found" message on Triggers tab
              And user will see "No Channels found" message on Channels tab
              And user will see "No Subscriptions found" message on Subscriptions tab


        Scenario: Empty state of Serving page: KA-03-TC02
            Given user is at Serving page
             Then user will see Create button
              And user will see "No Services found" message on Services tab
              And user will see "No Revisions found" message on Revisions tab
              And user will see "No Routes found" message on Routes tab
