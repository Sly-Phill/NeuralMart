// Static site content (marketing copy, membership tiers). Catalogue data lives in the database.

export const PLANS = [
  { id: 'starter', name: 'Starter', icon: 'Sparkles', monthly: 0, yearly: 0, blurb: 'Explore the marketplace and try anything.',
    features: ['Unlimited free trials', 'Wishlist & compare', '3 free apps', 'Community support'], cta: 'Start free' },
  { id: 'pro', name: 'Pro', icon: 'Zap', monthly: 29, yearly: 23, blurb: 'For creators and power users.', popular: true,
    features: ['Everything in Starter', '15% off every app', 'Unified billing', 'Priority support', 'Early access to new AI'], cta: 'Go Pro' },
  { id: 'business', name: 'Business', icon: 'Building2', monthly: 99, yearly: 79, blurb: 'For teams that run on AI.',
    features: ['Everything in Pro', '25% off every app', 'Team seats & SSO', 'Usage analytics', 'Dedicated manager'], cta: 'Contact sales' },
];

export const TRUSTED = ['Creators', 'Startups', 'Agencies', 'Enterprises', 'Developers', 'Educators', 'E-commerce', 'Healthcare', 'Nonprofits', 'Research Labs'];
