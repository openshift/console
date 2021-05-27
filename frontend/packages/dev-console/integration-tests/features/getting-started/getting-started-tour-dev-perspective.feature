@getting-started
Feature: Getting Started tour of developer perspective
              As a user I want to take tour of developer perspective


        @regression @to-do
        Scenario: Quick tour when user logs in for the first time: GS-02-TC01
            Given user is on login page for the first time
             When user enters the credential
              And user clicks on the login button
              And user switches to developer perspective if not already there
              And the Getting Started experience is automatically displayed
              And user can see first screen as 'Welcome to Dev perspective'
              And user can see the button labels on the first screen are 'Get Started' & 'Skip tour'
              And user clicks on Get started
              And user can see next screen appears on Perspective switcher
              And user can see the button labels as 'Next' & 'Back'
              And user can clicks on Next button
              And user can see next screen appears on Monitoring tab
              And user can see the button labels as 'Next' & 'Back'
              And user can clicks on Next button
              And user can see next screen appears on Search tab
              And user can see the button labels as 'Next' & 'Back'
              And user can clicks on Next button
              And user can see next screen appears on Help
              And user can see the button labels as 'Next' & 'Back'
              And user can clicks on Next button
              And user can see next screen appears is Final Screen saying 'You are ready to go!'
              And user can see the button labels as 'Okay, got it!' & 'Back'
              And user can clicks on 'Okay, got it!' button
             Then user is in the topology view in developer perspective


        @regression @to-do
        Scenario: Quick tour from help menu: GS-02-TC02
            Given user is in developer perspective with Dev_Workspace is available
             When user opens help menu on top right
              And user clicks on 'Guided Tour' option
              And user can see first screen as 'Welcome to Dev perspective'
              And user can see the button labels on the first screen are 'Get Started' & 'Skip tour'
              And user clicks on Get started
              And user can see next screen appears on Perspective switcher
              And user can see the button labels as 'Next' & 'Back'
              And user can clicks on Next button
              And user can see next screen appears on Monitoring tab
              And user can see the button labels as 'Next' & 'Back'
              And user can clicks on Next button
              And user can see next screen appears on Search tab
              And user can see the button labels as 'Next' & 'Back'
              And user can clicks on Next button
              And user can see next screen appears on Command Line Terminal
              And user can see the button labels as 'Next' & 'Back'
              And user can clicks on Next button
              And user can see next screen appears on Help
              And user can see the button labels as 'Next' & 'Back'
              And user can clicks on Next button
              And user can see next screen appears is Final Screen saying 'You are ready to go!'
              And user can see the button labels as 'Okay, got it!' & 'Back'
              And user can clicks on 'Okay, got it!' button
             Then user is in the topology view in developer perspective


        @regression @to-do
        Scenario: Stopping Quick tour in mid of the tour: GS-02-TC03
            Given user is in developer perspective
             When user opens help menu on top right
              And user clicks on 'Guided Tour' option
              And user can see the first screen as 'Welcome to Dev perspective'
              And user clicks on Get started
              And user can see next screen appears on Perspective switcher
              And user can see the button labels as 'Next' & 'Back' and 'X' button on top-right corner
              And user clicks on X button
              And closing out modal will open
              And user can see button labels as 'Back to tour' and 'Close'
              And user clicks on Close button
              And user is in the topology view in developer perspective
              And user opens help menu on top right
              And user clicks on 'Guided Tour' option
             Then user is taken to the first screen again
