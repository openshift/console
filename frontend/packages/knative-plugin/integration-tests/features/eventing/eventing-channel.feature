@knative-eventing @knative
Feature: Knative Eventing Channel Support
    User should be able to experience the Knative Eventing Channel and associated features

        Background:
            Given user has created or selected namespace "aut-eventing-channel"


        @smoke
        Scenario: Channel card on the Add page: KE-06-TC01
             When user navigates to Add page
             Then user will see the Channel card on the Add page


        @regression @odc-6359
        Scenario: Yaml in Channel: KE-06-TC02
             When user navigates to Add page
              And user clicks on the Channel card
              And user clicks on YAML view
             Then user can see reate button enabled


        @regression
        Scenario: Create InMemoryChannel: KE-06-TC03
             When user navigates to Add page
              And user clicks on the Channel card
              And user selects auto selected InMemoryChannel from Type dropdown
              And user selects Application
              And user enters the name of the Channel "channel-test"
              And user clicks on the Create button
             Then user will see the channel "channel-test" created


        @regression
        Scenario: Sink event source to Channel: KE-06-TC04
             When user has already created the channel "channel-test"
              And user navigates to Add page
              And user clicks on the Event Source card
              And user selects Ping Source card
              And user enters Schedule
              And user selects the channel "channel-test" from Resource dropdown
              And user selects the Application in the dropdown "channel-application"
              And user enters name of the ping source "ping-source"
              And user clicks on the Create button
             Then user will see that event source is connected to channel


        @regression @manual
        Scenario: Sink multiple event sources to Channel: KE-06-TC05
            Given user has event source sinked to channel on topology page
             When user navigates to Add page
              And user clicks on the Event Source card
              And user selects Ping Source card
              And user enters Schedule
              And user selects the channel "channel-test" from Resource dropdown
              And user selects the Application
              And user enters name of the event source
              And user clicks on the Create button
             Then user will see that multiple event sources are connected to single channel


        @regression
        Scenario: Context Menu for Channel: KE-06-TC06
             When user has already created the channel "channel-test"
              And user right clicks on the channel "channel-test"
             Then user will see the Context Menu for channel
              And user will see option "Edit application grouping"
              And user will see option "Add Subscription"
              And user will see option "Add Event Sink"
              And user will see option "Edit labels"
              And user will see option "Edit annotations"
              And user will see option "Edit Channel"
              And user will see option "Delete Channel"


        @regression
        Scenario: Edit Application Groupings to no application group action on Channel: KE-06-TC07
            Given user has already created the channel "channel-test"
             When user right clicks on the channel "channel-test"
              And user clicks on the "Edit application grouping"
              And user will click on the Application dropdown on the modal
              And user selects the "No application group" item
              And user clicks on Save button
             Then user will see that Channel is without an application group


        @regression
        Scenario: Edit Application Groupings action on Channel: KE-06-TC08
            Given user has already created the channel "channel-test"
             When user right clicks on the channel "channel-test"
              And user clicks on the "Edit application grouping"
              And user will click on the Application dropdown on the modal
              And user selects the Application "channel-application"
              And user clicks on Save button
             Then user will see the changed Application Groupings of Channel as "channel-application"


        @regression
        Scenario: Edit Labels action on Channel: KE-06-TC09
            Given user has already created the channel "channel-test"
             When user right clicks on the channel "channel-test"
              And user clicks on the "Edit labels"
              And user adds the label "app.kubernetes.io/channel-label=12"
              And user clicks on the Save button on the modal to save labels and close the modal
              And user clicks on the Channel "channel-test" to open the sidebar
              And user opens the "Details" tab
             Then user will see the newly added label "app.kubernetes.io/channel-label=12"


        @regression
        Scenario: Edit Annotations action on Channel: KE-06-TC10
            Given user has already created the channel "channel-test"
             When user right clicks on the channel "channel-test"
              And user clicks on the "Edit annotations"
              And user adds the annotation "eventing.knative.dev/channel.annotations" and type "test-annotation"
              And user clicks on the Save button on the modal to save annotation and close the modal
              And user clicks on the Channel "channel-test" to open the sidebar
              And user opens the "Details" tab
             Then user will see the newly added annotation "eventing.knative.dev/channel.annotations" and type "test-annotation"


        @regression
        Scenario: Edit Channel action on Channel: KE-06-TC11
            Given user has already created the channel "channel-test"
             When user right clicks on the channel "channel-test"
              And user clicks on the "Edit Channel"
             Then user will see the YAML editor to edit the channel


        @regression
        Scenario: Sidebar for the Channel: KE-06-TC12
            Given user has already created the channel "channel-test"
             When user clicks on the Channel "channel-test" to open the sidebar
             Then user will see the "Resources" tab
              And user will see the "Details" tab


        @regression
        Scenario: Details tab for the Channel: KE-06-TC13
            Given user has already created the channel "channel-test"
             When user clicks on the Channel "channel-test" to open the sidebar
              And user opens the "Details" tab
             Then user will see name of channel
              And user will see namespace of channel
              And user will see labels and annotations associated with channel
              And user will see the owner and channel created time


        @regression
        Scenario: Sidebar for the Channel subscribed to Knative Service: KE-06-TC14
            Given user is having Channel subscribed to Knative Service "kn-service" on the Topology page
             When user clicks on the Channel "channel-test" to open the sidebar
             Then user opens the "Resources" tab
              And user will see the Subscribers


        @regression
        Scenario: Sidebar for the channel connected with eventsources and knative services: KE-06-TC15
            Given user is having Channel subscribed to Knative Service and event source connected to it on the Topology page
             When user clicks on the Channel "channel-test" to open the sidebar
             Then user will see the "Resources" tab
              And user will see the Event Sources sinked to channel
              And user will see the Subscribers


        @regression
        Scenario: Delete Channel action on Channel: KE-06-TC16
            Given user has already created the channel "channel-test"
             When user right clicks on the channel "channel-test"
              And user clicks on the "Delete Channel"
              And user clicks on the Delete button on the modal
             Then user will not see channel "channel-test"

