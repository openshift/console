@guided-tour
Feature: Creating a Serverless application tour
              As a user, I want to take a guided tour of creating a serverless application feature

        Background:
            Given user is at developer perspective
              And user is at Add page


        @regression @to-do
        Scenario: Starting tour from the Add page: GT-02-TC01
            Given Build with guided documentation card is present in Add page
             When user clicks on the "Exploring Serverless applications" link on the card to see the tour will start with link to three steps present as a sidepane with close button
              And user clicks on the Start button to see "Creating a Serverless application" step started to create an Serverless application
              And user clicks on next
              And user selects Yes option on alert titled "Check your work" asking to verify that the Serverless Operator was successfully installed
              And user clicks on next to see step "Demoing scalability" started to see your application scale
              And user clicks on next
              And user selects Yes option on alert titled "Check your work" asking to verify that your application scaled successfully
              And user clicks on next to see step "Connecting an event source to your Knative Service" started to steps to connect an event source to your Knative Service
              And user clicks on next
              And user selects Yes option on alert titled "Check your work" asking to connect an event source to your Knative Service successfully
              And user clicks on next to see step "Forcing a new revision & set traffic distribution" started to force a new revision & set traffic distribution
              And user clicks on next
              And user selects Yes option on alert titled "Check your work" asking to verify that you forced a new revision & set traffic distribution successfully
              And user clicks on next to see step "Deleting your application" started to delete your application you just created
              And user clicks on next
              And user selects Yes option on alert titled "Check your work" asking to verify you deleted your application
              And user clicks on next
             Then user sees the message saying "You just learned how to use Serverless applications in your cluster"
              And user sees Knative Cookbook link
              And user sees "Close", "Back" and "Restart"
              And user sees Complete label marked on Exploring Serverless applications card after clicking on "close" button to close the sidepane


        @regression @to-do
        Scenario: Starting tour from the Quick Starts page: GT-02-TC02
            Given Build with guided documentation card is present in Add page
             When user clicks on the "View all quick starts" link on the card
              And user clicks on the "Exploring Serverless applications" link on the card to see the tour will start with link to three steps present as a sidepane with close button
              And user clicks on the Start button to see "Creating a Serverless application" step started to create an Serverless application
              And user clicks on next
              And user selects Yes option on alert titled "Check your work" asking to verify that the Serverless Operator was successfully installed
              And user clicks on next to see step "Demoing scalability" started to see your application scale
              And user clicks on next
              And user selects Yes option on alert titled "Check your work" asking to verify that your application scaled successfully
              And user clicks on next to see step "Connecting an event source to your Knative Service" started to steps to connect an event source to your Knative Service
              And user clicks on next
              And user selects Yes option on alert titled "Check your work" asking to connect an event source to your Knative Service successfully
              And user clicks on next to see step "Forcing a new revision & set traffic distribution" started to force a new revision & set traffic distribution
              And user clicks on next
              And user selects Yes option on alert titled "Check your work" asking to verify that you forced a new revision & set traffic distribution successfully
              And user clicks on next to see step "Deleting your application" started to delete your application you just created
              And user clicks on next
              And user selects Yes option on alert titled "Check your work" asking to verify you deleted your application
              And user clicks on next
             Then user sees the message saying "You just learned how to use Serverless applications in your cluster"
              And user sees Knative Cookbook link
              And user sees "Close", "Back" and "Restart"
              And user sees Complete label marked on Exploring Serverless applications card after clicking on "close" button to close the sidepane


        @regression @manual
        Scenario: Trying 'No' option during the tour: GT-02-TC03
            Given user is at Quick Starts catalog page
             When user clicks on the "Exploring Serverless applications" link on the card
              And user clicks on the Start button to see "Creating a Serverless application" step is started
              And user clicks on next
              And user selects No option on alert appears "Check your work" asking to verify that the Serverless Operator was successfully installed
             Then user sees that the alert is saying "This task isn't verified yet. Try the task again"


        @regression @manual
        Scenario: Avoiding option during the tour: GT-02-TC04
            Given user is at Quick Starts catalog page
             When user clicks on the "Exploring Serverless applications" card
              And user clicks on the Start button to start "Creating a Serverless application" step
              And user clicks on next to see "Check your work" alert asking to verify that the Serverless Operator was successfully installed
              And user clicks on next to see step "Demoing scalability" started
              And user clicks on next to see "Check your work" alert asking to verify that your application scaled successfully
              And user clicks on next to see step "Connecting an event source to your Knative Service" started
              And user clicks on next to see "Check your work" alert asking to connect an event source to your Knative Service successfully
              And user clicks on next to see step "Forcing a new revision & set traffic distribution" started
              And user clicks on next to see "Check your work" alert asking to verify that you forced a new revision & set traffic distribution successfully
              And user clicks on next to see step "Deleting your application" started
              And user clicks on next to see "Check your work" alert asking to verify you deleted your application
              And user clicks on next
              And user sees the message saying "You just learned how to use Serverless applications in your cluster"
              And user sees Knative Cookbook link
              And user sees "Close" and "Back"
              And user clicks "Back" button to go back to previous "Check your work" alert
              And user clicks on next
              And user clicks "close" button to close the sidepane back to tour page
             Then user sees Complete label marked on Creating a Serverless application card


        @regression @manual
        Scenario: Review the tour: GT-02-TC05
            Given Build with guided documentation card is present in Add page
             When user clicks on the "View all quick starts" link on the card
              And user clicks on the "Exploring Serverless applications" card
              And user clicks on the Start to see step "Creating a Serverless application" started
              And user clicks on next to see "Check your work" alert asking to verify that the Serverless Operator was successfully installed
              And user clicks on next to see step "Demoing scalability" started
              And user clicks on next to see "Check your work" alert asking to verify that your application scaled successfully
              And user clicks on next to see step "Connecting an event source to your Knative Service" started
              And user clicks on next to see "Check your work" alert asking to connect an event source to your Knative Service successfully
              And user clicks on next to see step "Forcing a new revision & set traffic distribution" started
              And user clicks on next to see "Check your work" alert asking to verify that you forced a new revision & set traffic distribution successfully
              And user clicks on next to see step "Deleting your application" started
              And user clicks on next to see "Check your work" alert asking to verify you deleted your application
              And user clicks on next
              And user clicks back button to go back to previous "Check your work" alert
              And user clicks on next
              And user clicks "close" button to close the sidepane back to tour page
             Then user sees Complete label marked on Creating a Serverless application card


        @regression @to-do
        Scenario: Stopping and again resuming the tour: GT-02-TC06
            Given Build with guided documentation card is present in Add page
             When user clicks on the "View all quick starts" link on the card
              And user clicks on the "Exploring Serverless applications" card
              And user clicks on the Start button to see "Creating a Serverless application" step is started
              And user clicks on the close button
              And user clicks on Leave button on modal "Are you sure you want to leave the tour"
              And user clicks on the "Exploring Serverless applications" card
             Then user sees the tour will start from the step "Creating a Serverless application"


        @regression @to-do
        Scenario: Navigating between steps in the tour: GT-02-TC07
            Given user is at Quick Starts catalog page
             When user clicks on the "Exploring Serverless applications" link on the card
              And user clicks on fifth step to start "Deleting your application"
              And user clicks on next to see "Check your work" alert asking to verify you deleted your application
              And user clicks on fourth step to start "Forcing a new revision & set traffic distribution"
              And user clicks on next to see "Check your work" alert asking to verify that you forced a new revision & set traffic distribution successfully
              And user clicks on third step to start "Connecting an event source to your Knative Service"
              And user clicks on next to see "Check your work" alert asking to connect an event source to your Knative Service successfully
              And user clicks on second step to start "Demoing scalability"
              And user clicks on next to see "Check your work" alert asking to verify that your application scaled successfully
              And user clicks on first step to start "Creating a Serverless application"
              And user clicks on next to see "Check your work" alert asking to verify that the Serverless Operator was successfully installed
              And user clicks on next
              And user sees step "Demoing scalability" with Check your work alert
              And user clicks on next
              And user sees step "Connecting an event source to your Knative Service" with Check your work alert
              And user clicks on next
              And user sees step "Forcing a new revision & set traffic distribution" with Check your work alert
              And user clicks on next
              And user sees step "Deleting your application" with Check your work alert
              And user clicks on next
             Then user sees the message saying "You just learned how to use Serverless applications in your cluster"
