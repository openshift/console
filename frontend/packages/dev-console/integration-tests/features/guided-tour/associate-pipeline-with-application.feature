@guided-tour
Feature: Deploying an application with a pipeline tour
              As a user, I want to take a guided tour to deploy an application with a pipeline feature

        Background:
            Given user is in developer perspective
              And user is at Add page


        @regression @to-do
        Scenario: Starting tour from the Add page: GT-01-TC01
            Given Build with guided documentation card is present in Add page
             When user clicks on the "Deploying an application with a pipeline" link on the card to see the tour will start with link to three steps present as a sidepane with close button
              And user clicks on the Start button to see "Importing an application and associate it with a pipeline" step to create an application
              And user clicks on next
              And user selects Yes on alert titled "Check your work" asking to verify that your application was successfully created
              And user clicks on next to see "Explore your application" started to explore your application in topology
              And user clicks on next
              And user selects Yes on alert titled "Check your work" asking to verify that the application has been created an a pipeline was associated
              And user clicks on next to see "Start and explore your pipeline run" step as You’ve just explored the topology of your application and seen it’s related resources. Now let’s start your pipeline
              And user clicks on next
              And user selects Yes on alert titled "Check your work" asking you should be brought to the Pipeline Run details page. To verify that your pipeline has started
              And user clicks on next
             Then user sees the message saying "You just created an application and associated a pipeline with it, and successfully explored the pipeline."
              And user sees "Close", "Back" and "Restart"
              And user sees Complete label marked on Deploying an application with a pipeline card when user clicks "close" button to close the sidepane


        @regression @to-do
        Scenario: Starting tour from the Quick Starts page: GT-01-TC02
            Given Build with guided documentation card is present in Add page
             When user clicks on the "View all quick starts" link on the card
              And user clicks on the "Deploying an application with a pipeline" link on the card to see the tour will start with link to three steps present as a sidepane with close button
              And user clicks on the Start button to see "Importing an application and associate it with a pipeline" step to create an application
              And user clicks on next
              And user selects Yes on alert titled "Check your work" asking to verify that your application was successfully created
              And user clicks on next to see "Explore your application" started to explore your application in topology
              And user clicks on next
              And user selects Yes on alert titled "Check your work" asking to verify that the application has been created an a pipeline was associated
              And user clicks on next to see "Start and explore your pipeline run" step as You’ve just explored the topology of your application and seen it’s related resources. Now let’s start your pipeline
              And user clicks on next
              And user selects Yes on alert titled "Check your work" asking you should be brought to the Pipeline Run details page. To verify that your pipeline has started
              And user clicks on next
             Then user sees the message saying "You just created an application and associated a pipeline with it, and successfully explored the pipeline."
              And user sees "Close", "Back" and "Restart"
              And user sees Complete label marked on Deploying an application with a pipeline card when user clicks "close" button to close the sidepane


        @regression @to-do
        Scenario: Trying No option during the tour: GT-01-TC03
            Given user is at Quick Starts catalog page
             When user clicks on the "Deploying an application with a pipeline" link on the card
              And user clicks on the Start button to start "Importing an application and associate it with a pipeline" step
              And user clicks on next
              And user selects No option on alert appears "Check your work" asking to verify that the Serverless Operator was successfully installed
             Then user sees that the alert is saying "This task isn't verified yet. Try the task again"


        @regression @to-do
        Scenario: Avoiding option during the tour: GT-01-TC04
            Given user is at Quick Starts catalog page
             When user clicks on the Deploying an application with a pipeline card
              And user clicks on the Start button to see "Importing an application and associate it with a pipeline" step started
              And user clicks on next to see "Check your work" alert asking to verify that the Pipelines Operator was successfully installed
              And user clicks on next to see next step "Explore your application" started
              And user clicks on next to see "Check your work" alert asking to verify that the application has been created an a pipeline was associated
              And user clicks on next
              And user clicks on Close button
             Then user sees Complete label marked on Deploying an application with a pipeline card


        @regression @to-do
        Scenario: Review the tour: GT-01-TC05
            Given Build with guided documentation card is present in Add page
             When user clicks on the "View all quick starts" link on the card
              And user clicks on the Deploying an application with a pipeline card
              And user clicks on the Start button to see "Importing an application and associate it with a pipeline" step started
              And user clicks on next to see "Check your work" alert asking to verify that the Pipelines Operator was successfully installed
              And user clicks on next to see next step "Explore your application" started
              And user clicks on next to see "Check your work" alert asking to verify that the application has been created an a pipeline was associated
              And user clicks on next to see step "Exploring your pipeline runs" started
              And user clicks on next to see "Check your work" alert asking you should be brought to the Pipeline Run details page. To verify that your pipeline has started
              And user clicks on next
              And user clicks back button to go back to previous "Check your work" alert
              And user clicks on next
              And user clicks "close" button to close the sidepane back to tour page
             Then user sees Complete label marked on Deploying an application with a pipeline card


        @regression @to-do
        Scenario: Stopping and again resuming the tour: GT-01-TC06
            Given Build with guided documentation card is present in Add page
             When user clicks on the "View all quick starts" card
              And user clicks on the Deploying an application with a pipeline card
              And user clicks on the Start button to see "Importing an application and associate it with a pipeline" step
              And user clicks on next
              And user selects Yes on alert titled "Check your work"
              And user clicks the close button
              And user clicks on Leave button on modal "Are you sure you want to leave the tour"
              And user clicks on the Deploying an application with a pipeline card
             Then user sees that the tour has started again with Yes selected for the alert titled "Check your work" in step 1


        @regression @to-do
        Scenario: Navigating between steps in the tour: GT-01-TC07
            Given user is at Quick Starts catalog page
             When user clicks on the "Deploying an application with a pipeline" card
              And user clicks on third step "Exploring your pipeline run" from the link to three steps present in the card
              And user clicks on next
              And user selects Yes in alert titled "Check your work" asking you should be brought to the Pipeline Run details page. To verify that your pipeline has started
              And user clicks on second step "Exploring your application"
              And user clicks on next
              And user selects Yes in alert titled "Check your work" asking to verify that the application has been created an a pipeline was associated
              And user clicks on first step "Importing an application and associate it with a pipeline" step
              And user clicks on next
              And user selects Yes in alert titled "Check your work" asking to verify that your application was successfully created
              And user clicks on next to see step "Exploring your application" with Check your work alert
              And user clicks on next to see step "Exploring your pipeline run" with Check your work alert
              And user clicks on next
             Then user sees the message saying "You just created an application and associated a pipeline with it, and successfully explored the pipeline."
