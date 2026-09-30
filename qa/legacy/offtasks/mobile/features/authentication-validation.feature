@e2e @mobile @authentication @validation
# Feature code: 2
Feature: Mobile authentication validation and errors
    The mobile auth screen should block incomplete input and show clear alerts for auth failures.

    Background:
        Given the tester is using a simulator or device connected to the configured Supabase project

    # Scenario code: 2.1
    Scenario: Block sign in with missing details
        Given the tester is on the authentication screen in sign in mode
        When the tester submits the form without email or password
        Then the app should show the Missing details alert
        And the tester should remain on the authentication screen

    # Scenario code: 2.2
    Scenario: Show authentication error for invalid sign in
        Given the tester is on the authentication screen in sign in mode
        When the tester enters an email address with an invalid password
        And the tester submits the form
        Then the app should show an Authentication error alert
        And the authenticated workspace should not open

    # Scenario code: 2.3
    Scenario: Block signup when passwords do not match
        Given the tester switches to sign up mode
        When the tester enters different password and confirmation values
        And the tester submits the form
        Then the app should show the Passwords do not match alert
        And the form should stay in sign up mode

    # Scenario code: 2.4
    Scenario: Require an email before password reset
        Given the tester is on the authentication screen in sign in mode
        When the tester triggers forgot password without entering an email
        Then the app should show the Email required alert
        And no reset request should be sent

    # Scenario code: 2.5
    Scenario: Prevent duplicate auth submissions while loading
        Given the tester has entered valid auth details
        When the tester submits the form
        Then the primary action should show a loading state
        And repeated taps should not create duplicate signup or reset requests