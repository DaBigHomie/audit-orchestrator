/**
 * Rule: Checkout flow — page, cart feature, Stripe, components, shipping.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { AuditRuleContext } from '../types.js';
import { countMatches } from '../scanner.js';

export function auditCheckoutFlow(ctx: AuditRuleContext): number {
  let score = 0;
  const checks = 5;
  const src = ctx.adapter.resolveSrc(ctx.root);

  // Checkout page
  const checkoutPaths = [
    join(src, 'app', 'checkout', 'page.tsx'),
    join(src, 'pages', 'Checkout.tsx'),
    join(src, 'pages', 'UnifiedCheckout.tsx'),
  ];
  if (checkoutPaths.some((p) => existsSync(p))) score++;

  // Cart feature
  const cartPaths = [
    join(src, 'features', 'cart'),
    join(src, 'features', 'checkout'),
    join(src, 'hooks', 'useCheckout.ts'),
  ];
  if (cartPaths.some((p) => existsSync(p))) score++;

  // Stripe integration
  const stripeImports = countMatches(src, /@stripe\/|loadStripe|stripe/g);
  if (stripeImports > 2) score++;

  // Checkout components
  const componentPaths = [
    join(src, 'features', 'checkout'),
    join(src, 'components', 'checkout'),
    join(src, 'components', 'payments'),
  ];
  if (componentPaths.some((p) => existsSync(p))) score++;

  // Shipping method
  const shippingRefs = countMatches(src, /shipping|ShippingMethod|shippingMethod/g);
  if (shippingRefs > 0) score++;

  return Math.round((score / checks) * 100);
}
