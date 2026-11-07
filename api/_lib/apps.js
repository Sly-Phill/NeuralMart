// Shared SQL fragment + row mapper so every endpoint returns apps in the same shape.

export const APP_SELECT = `
  SELECT a.id, a.slug, a.name, a.tagline, a.description, a.icon_url, a.price_monthly, a.price_yearly,
         a.has_free_trial, a.trial_days, a.rating_avg, a.rating_count, a.is_featured, a.created_at,
         a.icon_name, a.brand_colors, a.hours_saved, a.use_cases, a.integrations,
         c.slug AS category_slug, c.name AS category_name,
         s.full_name AS developer,
         COALESCE((SELECT array_agg(f.feature_text ORDER BY f.order_index) FROM app_features f WHERE f.app_id = a.id), '{}') AS features
  FROM apps a
  JOIN categories c ON c.id = a.category_id
  LEFT JOIN users s ON s.id = a.seller_id`;

const num = (v) => (v == null ? 0 : Number(v));

export function toApp(r) {
  return {
    id: r.slug, // the UI identifies apps by slug
    dbId: r.id,
    name: r.name,
    tagline: r.tagline,
    description: r.description,
    iconUrl: r.icon_url,
    icon: r.icon_name,
    colors: r.brand_colors,
    price: num(r.price_monthly),
    priceYearly: num(r.price_yearly),
    freeTrial: r.has_free_trial,
    trialDays: r.trial_days,
    rating: Math.round(num(r.rating_avg) * 10) / 10,
    reviews: r.rating_count,
    featured: r.is_featured,
    released: new Date(r.created_at).toISOString(),
    developer: r.developer || 'Independent developer',
    category: r.category_slug,
    categoryName: r.category_name,
    features: r.features || [],
    useCases: r.use_cases || [],
    integrations: r.integrations || [],
    hoursSaved: r.hours_saved,
  };
}

export const SORTS = {
  popular: 'a.rating_count DESC, a.rating_avg DESC',
  newest: 'a.created_at DESC',
  rating: 'a.rating_avg DESC, a.rating_count DESC',
  'price-asc': 'a.price_monthly ASC, a.rating_avg DESC',
  'price-desc': 'a.price_monthly DESC, a.rating_avg DESC',
};

export const splitList = (v, max = 20) =>
  String(v || '').split(',').map((s) => s.trim().toLowerCase()).filter((s) => /^[a-z0-9-]{1,80}$/.test(s)).slice(0, max);
