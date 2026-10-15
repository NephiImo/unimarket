# W06 color contrast audit

Date: 15 October 2026. This change targets enhanced text contrast across the homepage, listing browse/detail pages, login, registration, dashboard, listing/profile/inquiry forms, and received inquiries. It is a numerical and source audit, not browser certification or a claim of full WCAG conformance.

The target is 7:1 for ordinary text under [WCAG 2.2 Contrast (Enhanced), SC 1.4.6](https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html). The AA baseline is 4.5:1 for ordinary text under [Contrast (Minimum), SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Placeholders and text in hover/focus states are included.

Ratios were independently calculated from sRGB channels with an ephemeral Node calculation. For each channel, `s = channel / 255`; linearize as `s / 12.92` when `s <= 0.04045`, otherwise `((s + 0.055) / 1.055) ** 2.4`. Relative luminance is `0.2126R + 0.7152G + 0.0722B`; contrast is `(lighter + 0.05) / (darker + 0.05)`. Values below are rounded to three decimals for display; comparisons use unrounded results.

| Text foreground | Cream `#F6F1EA` | Card `#FFFDFC` |
| --- | ---: | ---: |
| Terracotta `#783322` | 8.142:1 | 9.022:1 |
| Dark sage `#3A5634` | 7.299:1 | 8.087:1 |
| Muted `#514741` | 8.030:1 | 8.897:1 |

| Additional pair | Contrast |
| --- | ---: |
| White `#FFFFFF` on CTA `#783322` | 9.149:1 |
| White `#FFFFFF` on CTA hover `#5C2618` | 12.031:1 |
| Card `#FFFDFC` on CTA default / hover | 9.022:1 / 11.864:1 |
| Terracotta `#783322` on Hero's 40% peach hover over cream | 7.175:1 |
| White `#FFFFFF` on availability badge `#3A5634` | 8.201:1 |
| Plum `#503A45` on category badge, worst-case composite | 9.123:1 |
| Peach `#EBC8BA` on HowItWorks `#422B35` | 8.291:1 |
| Cream `#F6F1EA` on HowItWorks `#422B35` | 11.475:1 |

All listed text pairs exceed 7:1. The category badge uses `#FFFDFC` at 95% opacity over listing imagery. Black is the darkest possible image backdrop: source-over compositing gives RGB `(242.25, 240.35, 239.40)` before luminance calculation. The calculation retains fractional channels. The availability badge conveys status, so its fill changes from light sage to `#3A5634` to give white text enhanced contrast.

CTA default/hover colors are opaque; hover opacity no longer weakens their contrast. Sign-in/sign-out hover colors change instantly to avoid low contrast during simultaneous foreground/background interpolation. Muted text and placeholders are opaque `#514741`. Existing decorative palette tokens, pastel borders, pale/translucent backgrounds, imagery, layout utilities, and responsive breakpoints are unchanged. Native disabled controls retain their reduced opacity: inactive controls are exempt from the cited contrast requirements.

The global keyboard-focus fallback is a solid 2px `#783322` outline with a 3px offset. Against cream/card surfaces it provides 8.142:1/9.022:1; form controls also receive solid dark focus rings. These source colors exceed the 3:1 state-indicator threshold in [Non-text Contrast, SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). [Focus Appearance, SC 2.4.13](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) additionally requires sufficient indicator area and contrast between focused/unfocused pixels; rendered geometry still needs review.

A read-only category check returned Books, Electronics, Fashion, Food, Furniture, Other, and Vehicles. Housing was absent, so the homepage category card uses Furniture. This change does not create or modify database categories.

Browser automation was unavailable (`list_browsers` returned `[]`). Manual checks remain for rendered desktop/mobile layouts, zoom, keyboard focus visibility and clipping/obscuration, and actual validation/error/success states. These limits also apply to any unchanged borders or other visual boundaries outside the numerical matrix.

Verification: `npm test` passed all 40 existing tests; `npx tsc --noEmit`, `npm run lint`, and `npm run build` passed. ESLint retains two existing warnings: `ListingCard` uses `<img>` and registration uses `window.location.href`. The build reports an ignored lockfile outside the repository. No migrations or database mutation tests were run.
