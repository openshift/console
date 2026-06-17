import { useTranslation } from 'react-i18next';
import { getReportBugLink } from '@console/internal/module/k8s/cluster-settings';

export function useFeedbackLocal(reportBug: ReturnType<typeof getReportBugLink>) {
  const { t } = useTranslation('public');

  return {
    getSupport: reportBug.description,
    back: t('Back'),
    bugReported: t('Bug Reported'),
    cancel: t('Cancel'),
    close: t('Close'),
    describeBug: t(
      'Describe the bug you encountered. For urgent issues, open a support case instead.',
    ),
    describeBugUrgentCases: t(
      'Describe the bug you encountered. For urgent issues, open a support case instead.',
    ),
    describeReportBug: t(
      'Describe the bug you encountered. Include where it is located and what action caused it. If this issue is urgent or blocking your workflow,',
    ),
    directInfluence:
      'public~your feedback will directly influence the future of Red Hat’s products. Opt in below to hear about future research opportunities via email.',
    email: t('Email'),
    enterFeedback: t('Enter your feedback'),
    feedback: t('Feedback'),
    feedbackSent: t('Feedback Sent'),
    helpUsImproveHCC: t('Help us improve Red Hat OpenShift.'),
    howIsConsoleExperience: t('What has your experience been like so far?'),
    joinMailingList: t('Join mailing list'),
    informDirectionDescription: t(
      'By participating in feedback sessions, usability tests, and interviews with our',
    ),
    informDirection: t('Inform the direction of Red Hat'),
    learnAboutResearchOpportunities: t(
      'Learn about opportunities to share your feedback with our User Research Team.',
    ),
    openSupportCase: reportBug.label,
    problemProcessingRequest: t(
      'There was a problem processing the request. Try reloading the page. If the problem persists, contact',
    ),
    support: t('Support'),
    redHatSupport: t('Red Hat support'),
    reportABug: t('Report a bug'),
    responseSent: t('Response sent'),
    researchOpportunities: t('Yes, I would like to hear about research opportunities'),
    shareFeedback: t('Share feedback'),
    shareYourFeedback: t('Share your feedback with us!'),
    somethingWentWrong: t('Something went wrong'),
    submitFeedback: t('"Submit feedback'),
    teamWillReviewBug: t(
      'We appreciate your feedback and our team will review your report shortly',
    ),
    tellAboutExperience: t('Tell us about your experience'),
    thankYouForFeedback: t('Thank you, we appreciate your feedback.'),
    thankYouForInterest: t(
      'Thank you for your interest in user research. You have been added to our mailing list.',
    ),
    userResearchTeam: t('User Research Team'),
    weNeverSharePersonalInformation: t(
      'We never share your personal information, and you can opt out at any time.',
    ),
  };
}
