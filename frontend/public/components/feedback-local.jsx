import { useTranslation } from 'react-i18next';

export function useFeedbackLocal(reportBug) {
  const { t } = useTranslation();

  return {
    getSupport: reportBug.description,
    back: t('public~Back'),
    bugReported: t('public~Bug Reported'),
    cancel: t('public~Cancel'),
    close: t('public~Close'),
    describeBug: t(
      'public~Describe the bug you encountered. For urgent issues, open a support case instead.',
    ),
    describeBugUrgentCases: t(
      'public~Describe the bug you encountered. For urgent issues, open a support case instead.',
    ),
    describeReportBug: t(
      'public~Describe the bug you encountered. Include where it is located and what action caused it. If this issue is urgent or blocking your workflow,',
    ),
    directInfluence:
      'public~your feedback will directly influence the future of Red Hat’s products. Opt in below to hear about future research opportunities via email.',
    email: t('public~Email'),
    enterFeedback: t('public~Enter your feedback'),
    feedback: t('public~Feedback'),
    feedbackSent: t('public~Feedback Sent'),
    helpUsImproveHCC: t('public~Help us improve Red Hat OpenShift.'),
    howIsConsoleExperience: t('public~What has your experience been like so far?'),
    joinMailingList: t('public~Join mailing list'),
    informDirectionDescription: t(
      'public~By participating in feedback sessions, usability tests, and interviews with our',
    ),
    informRedhatDirection: t('public~Inform the direction of Red Hat'),
    learnAboutResearchOpportunities: t(
      'public~Learn about opportunities to share your feedback with our User Research Team.',
    ),
    openSupportCase: reportBug.label,
    problemProcessingRequest: t(
      'public~There was a problem processing the request. Try reloading the page. If the problem persists, contact',
    ),
    redHatSupport: t('public~Red Hat support'),
    reportABug: t('public~Report a bug'),
    responseSent: t('public~Response sent'),
    researchOpportunities: t('public~Yes, I would like to hear about research opportunities'),
    shareFeedback: t('public~Share feedback'),
    shareYourFeedback: t('public~Share your feedback with us!'),
    somethingWentWrong: t('public~Something went wrong'),
    submitFeedback: t('"Submit feedback'),
    teamWillReviewBug: t(
      'public~We appreciate your feedback and our team will review your report shortly',
    ),
    tellAboutExperience: t('public~Tell us about your experience'),
    thankYouForFeedback: t('public~Thank you, we appreciate your feedback.'),
    thankYouForInterest: t(
      'public~Thank you for your interest in user research. You have been added to our mailing list.',
    ),
    userResearchTeam: t('public~User Research Team'),
    weNeverSharePersonalInformation: t(
      'public~We never share your personal information, and you can opt out at any time.',
    ),
  };
}
