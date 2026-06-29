---
name: Executive Logistics
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e5'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3fe'
  surface-container: '#ededf9'
  surface-container-high: '#e7e7f3'
  surface-container-highest: '#e1e2ed'
  on-surface: '#191b23'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3039'
  inverse-on-surface: '#f0f0fb'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#943700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#faf8ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ed'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  sidebar-width: 260px
  container-padding: 32px
  container-padding-mobile: 16px
  gutter: 24px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style
The design system is engineered for a premium vehicle rental marketplace, prioritizing clarity, efficiency, and a high-end SaaS aesthetic. The brand personality is professional and reliable, evoking the precision of modern developer tools and the hospitality of luxury travel platforms.

The style is rooted in **Minimalism** with a heavy emphasis on structural integrity and whitespace. It avoids decorative flourishes like gradients or heavy textures in favor of crisp borders, purposeful alignment, and high-quality typography. The goal is to create a fast, "utilitarian-luxe" interface that feels sophisticated yet invisible, allowing the high-value assets (vehicles) and data to remain the focal point.

## Colors
The palette is built on a foundation of neutral professionalism with high-performance blue accents. 

- **Primary & Actions:** #2563EB serves as the single source of truth for interactivity. No gradients are permitted; depth is achieved through state-based shifts to #1D4ED8.
- **Surface Strategy:** The background uses #F8FAFC to provide a subtle contrast against the white (#FFFFFF) cards and sidebars, creating a clear sense of layering without heavy shadows.
- **Semantic Logic:** Standardized colors for Success, Warning, and Danger are used strictly for status indicators and destructive actions to maintain a serious, enterprise-grade tone.

## Typography
The system utilizes **Inter** exclusively to ensure a systematic, neutral, and highly legible experience. 

- **Headlines:** Use Semi-Bold (600) weights with tight letter-spacing for a modern, architectural feel. Large headings should be used sparingly to maintain the minimalist SaaS aesthetic.
- **Body:** The default reading weight is Regular (400) at 16px. Medium (500) is reserved for emphasis or smaller UI labels to ensure legibility against light backgrounds.
- **Labels:** Small, uppercase labels with increased letter-spacing are used for table headers and category descriptors to create a clear visual hierarchy.

## Layout & Spacing
This design system adheres to a strict **8px grid system**. All margins, paddings, and component heights must be multiples of 8.

- **Dashboard Structure:** A fixed 260px left-hand sidebar contains primary navigation. The top navbar remains fixed to provide global search and user actions.
- **Main Content:** Content is housed in a centered container with a fluid width but a maximum readable span for data tables. 
- **Responsive Behavior:** On tablet, the sidebar collapses into a hamburger menu. On mobile, padding reduces to 16px, and multi-column grid layouts reflow into a single-column stack.

## Elevation & Depth
Depth is communicated through **Tonal Layers** and extremely subtle **Ambient Shadows**.

- **Level 0 (Background):** #F8FAFC. The lowest layer.
- **Level 1 (Surface):** #FFFFFF. Used for the sidebar, navbar, and primary cards. These elements use a 1px border of #E2E8F0.
- **Level 2 (Overlay):** Used for dropdowns and modals. These feature a soft, diffused shadow: `0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)`.

Avoid high-contrast shadows. The separation between elements should rely primarily on the #E2E8F0 border and the slight shift in background tone.

## Shapes
The shape language is consistently "Rounded" to balance the professional tone with a modern, approachable feel.

- **Cards & Large Containers:** Use a 16px (`rounded-lg` in this system) corner radius to create a soft, high-end frame for content.
- **Buttons & Inputs:** Use an 8px radius to maintain a precise, clicky feel that aligns with the 8px spacing grid.
- **Status Badges:** Use a fully pill-shaped radius (9999px) to distinguish them from interactive buttons.

## Components
Consistent execution of these components ensures the "Premium SaaS" aesthetic:

- **Buttons:** Primary buttons use #2563EB with white text. No border. Hover state transitions to #1D4ED8. Secondary buttons use a white background with #E2E8F0 border and #0F172A text.
- **Input Fields:** 1px border (#E2E8F0) with 8px radius. On focus, the border changes to #2563EB and a subtle 3px soft blue outer glow (ring) is applied.
- **Cards:** White background, 16px radius, 1px #E2E8F0 border. Content inside cards should follow the 24px internal padding rule.
- **Status Badges:** Low-saturation backgrounds with high-saturation text. For example, "Approved" uses a light green tint with #22C55E text.
- **Data Tables:** No vertical borders. Use 1px #E2E8F0 horizontal dividers. Row hover state uses #F8FAFC.
- **Sidebar Nav:** Active items use a subtle light blue background wash or a 2px vertical primary blue bar on the left edge to indicate current location.