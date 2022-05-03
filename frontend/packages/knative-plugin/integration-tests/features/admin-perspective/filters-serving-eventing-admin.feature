@knative-admin
Feature: Filters on Serving and Eventing page
              As a user, I should be able to use filters as per the use


        Background:
            Given user has created or selected namespace "aut-serving-eventing"
              And user has created knative service "hello-openshift"
              And user is at administrator perspective

        @regression
        Scenario: Search by name correctly: KA-02-TC01
            Given user is at Serving page
              And user has selected Services tab
             When user clicks on dropdown button
              And user selects Name
              And user enters "hello-openshift"
             Then user will see KSVC by name "hello-openshift"
              And user will see Clear all filters


        @regression
        Scenario: Search by label correctly: KA-02-TC02
            Given user is at Serving page
              And user has selected Routes tab
             When user clicks on dropdown button
              And user selects Label
              And user enters "hello-openshift" in Label filter
             Then user will see routes for KSVC by name "hello-openshift"
              And user will see Clear all filters


        @regression
        Scenario: Search by name incorrectly: KA-02-TC03
            Given user is at Serving page
              And user has selected Revisions tab
             When user clicks on dropdown button
              And user selects Name
              And user enters "xyz"
             Then user will see message "No Revisions found"
              And user will see Clear all filters


        @regression
        Scenario: Filter the Event Sources: KA-02-TC04
            Given user has created ApiServer Source
              And user has created Ping Source
              And user has created Sink Binding
              And user has created Container Source
              And user is at Event Sources tab
             When user clicks on Filter dropdown
             Then user will see digit "1" in front of ApiServer, Ping, Container Sources and digit "2" in front of SinkBinding
              And user will see ApiServer source type as ApiSource is selected in filter dropdown
              And user will see Container source type as ContainerSource is selected in filter dropdown
              And user will see Ping source type as PingSource is selected in filter dropdown
              And user will see Sink source type as SinkBinding is selected in filter dropdown


        @regression
        Scenario: Filter the Channels: KA-02-TC05
            Given user has created Default Channel
              And user has created In Memory Channel
              And user is at Channels tab
             When user clicks on Filter dropdown
             Then user will see digit "1" in front of Channel and digit "2" in front of InMemoryChannel
              And user will see Channel type as Channel is selected in filter dropdown
              And user will see In Memory Channel type as InMemoryChannel is selected in filter dropdown


        @manual
        Scenario: Filter the Event sources after Camel source creation: KA-02-TC06
            Given user has created knative service "hello-openshift"
              And user has created Camel source
              And user has created Ping Binding
              And user is at Event Sources tab
             When user clicks on Filter dropdown
             Then user will see digit "1" in front of Camel Source, Ping Sources checkboxes
              And user will see only Ping sources as checked
              And user will see only Camel sources as checked
