export interface ProjectItem {
  id: string;
  tag: string;
  title: string;
  description: string;
  meta: string;
  sceneType: 'torus-knot' | 'wave-matrix' | 'orbital-cube';
  spanClass: string;
  cursorLabel: string;
}

export interface SkillItem {
  title: string;
  description: string;
}

export interface AboutStep {
  label: string;
  value: string;
}

export const SITE_CONTENT = {
  brandPrefix: 'Al ',
  brandAccent: 'Amin.',
  nav: {
    home: 'Home',
    about: 'About Me',
    services: 'Services',
    projects: 'Projects',
    contact: 'Contact',
  },
  hero: {
    kicker: 'Welcome to my portfolio',
    headlineLine1: "Hi, I'm",
    headlineAccent: 'Al Amin.',
    subheadline:
      'I Help Plumbers & Local Businesses Get More 5-Star Reviews, Fix Bad Reviews & Grow on Google.',
    primaryCta: 'Explore my work ↗',
    secondaryCta: 'Get in touch',
    portraitAlt: 'Portrait of Al Amin',
    portraitCaption: 'ORM Expert | Google Review Management | USA Clients',
    cursorDragLabel: '3D Drag',
  },
  about: {
    kicker: 'A Little Introduction',
    headingPrefix: 'About ',
    headingAccent: 'Me',
    subtitle: 'A reputation expert who helps local businesses look trustworthy on Google.',
    description:
      "Hello! I'm Al Amin. I help Plumbers, Electricians and Roofers in USA fix their Google reviews. I check which bad reviews can be removed, reply professionally to the rest, and help you get real 5-Star reviews from happy customers.",
    steps: [
      { label: 'Focus', value: 'Bad Review Check' },
      { label: 'Next Step', value: 'Reply & Fix' },
      { label: 'Goal', value: 'More 5-Star Reviews' },
      { label: 'Approach', value: '100% Real & Safe' },
    ] as AboutStep[],
  },
  skills: {
    kicker: 'What I Do For You',
    headingPrefix: 'My ',
    headingAccent: 'Skills',
    subtitle: 'These are the services I provide to grow your business on Google.',
    items: [
      {
        title: 'Google Review Management',
        description: 'Checking and managing all your Google reviews daily.',
      },
      {
        title: 'Bad Review Removal',
        description: 'Reporting fake & policy-violating reviews properly to Google.',
      },
      {
        title: 'Professional Reply',
        description: 'Replying to bad reviews in a polite, professional way.',
      },
      {
        title: '5-Star Review System',
        description: 'Helping you get new 5-star reviews from happy customers.',
      },
    ] as SkillItem[],
  },
  projects: {
    kicker: "Things I'm Working On",
    headingPrefix: 'Featured ',
    headingAccent: 'Projects',
    subtitle: 'Examples of the services and workflows presented in this portfolio.',
    items: [
      {
        id: 'plumber-fix',
        tag: 'For Plumbers',
        title: 'Plumber Review Fix',
        description:
          "I checked a plumber's 2.8 rating, reported 3 fake reviews and replied to all bad reviews. Rating went up in 30 days.",
        meta: 'Google Reviews • ORM',
        sceneType: 'torus-knot',
        spanClass: 'md:col-span-2',
        cursorLabel: 'Explore',
      },
      {
        id: 'five-star-growth',
        tag: 'Most Popular',
        title: '5-Star Review Growth',
        description:
          'A simple system to ask happy customers for a review right after the job is done. More reviews = More calls.',
        meta: 'Review System • Growth',
        sceneType: 'orbital-cube',
        spanClass: 'md:col-span-1',
        cursorLabel: 'Inspect',
      },
      {
        id: 'reputation-management',
        tag: 'This Website',
        title: 'Reputation Management',
        description:
          'Full monthly management - check reviews, reply, report bad ones, and keep your profile clean and trusted.',
        meta: 'Monthly Service • ORM',
        sceneType: 'wave-matrix',
        spanClass: 'md:col-span-3',
        cursorLabel: 'Explore',
      },
    ] as ProjectItem[],
    note: 'Note: Keep specific client results and performance claims here only if you can verify them and have permission to share them.',
  },
  contact: {
    kicker: "Let's Connect",
    headingPrefix: 'Contact ',
    headingAccent: 'Me',
    subtitle: 'Have bad reviews? Want a FREE check? Send me a message.',
    infoHeading: 'Get in touch',
    infoBody:
      "I'm always happy to check your Google reviews for FREE and tell you what to fix.",
    email: 'mdalamin76553@gmail.com',
    infoNote: 'Fill the form below - I will reply within 24 hours.',
    nameLabel: 'Your name',
    namePlaceholder: 'Enter your name',
    emailLabel: 'Your email',
    emailPlaceholder: 'you@example.com',
    businessLabel: 'Your Business Name',
    businessPlaceholder: 'e.g. Bronx Plumbing LLC',
    messageLabel: 'Message',
    messagePlaceholder: 'Tell me about your bad reviews...',
    submitLabel: 'Send Message ↗',
    submittingLabel: 'Sending...',
    whatsappUrl: 'https://wa.me/8801881024899',
    whatsappLabel: 'Chat on WhatsApp',
    formSubmitNote:
      'The contact form is handled by FormSubmit. On first use, FormSubmit may send a confirmation email to activate delivery.',
    successTitle: 'Message Sent',
    successBody:
      'Thank you! Your message has been sent to mdalamin76553@gmail.com. I will reply within 24 hours.',
    resetLabel: 'Send another message',
    errorRequired: 'Please fill in your name, email, business name, and message.',
    errorInvalidEmail: 'Please enter a valid email address.',
  },
  footer: '© 2026 Al Amin. Built with care.',
};
