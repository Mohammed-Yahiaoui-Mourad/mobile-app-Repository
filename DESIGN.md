---
name: Vital Life Design System
colors:
  surface: '#f8f9ff'
  surface-dim: '#d0dbed'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dee9fc'
  surface-container-highest: '#d9e3f6'
  on-surface: '#121c2a'
  on-surface-variant: '#5c403f'
  inverse-surface: '#27313f'
  inverse-on-surface: '#eaf1ff'
  outline: '#906f6e'
  outline-variant: '#e5bdbb'
  surface-tint: '#bf0229'
  primary: '#9e001f'
  on-primary: '#ffffff'
  primary-container: '#c8102e'
  on-primary-container: '#ffdad8'
  inverse-primary: '#ffb3b1'
  secondary: '#5b5f61'
  on-secondary: '#ffffff'
  secondary-container: '#e0e3e6'
  on-secondary-container: '#626567'
  tertiary: '#00583b'
  on-tertiary: '#ffffff'
  tertiary-container: '#00734e'
  on-tertiary-container: '#6efbbd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad8'
  primary-fixed-dim: '#ffb3b1'
  on-primary-fixed: '#410007'
  on-primary-fixed-variant: '#92001c'
  secondary-fixed: '#e0e3e6'
  secondary-fixed-dim: '#c4c7ca'
  on-secondary-fixed: '#191c1e'
  on-secondary-fixed-variant: '#44474a'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#121c2a'
  surface-variant: '#d9e3f6'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
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
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max-width: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  unit-xs: 4px
  unit-sm: 8px
  unit-md: 16px
  unit-lg: 24px
  unit-xl: 48px
---

## Brand & Style

The design system is engineered to evoke trust, urgency, and professional care. It serves as a bridge between donors and critical medical needs, balancing the clinical precision of a healthcare environment with a welcoming, accessible human touch. 

The aesthetic is **Modern Corporate**, utilizing generous whitespace and a refined color palette to reduce cognitive load during high-stress emergency situations. It prioritizes clarity and functional elegance, ensuring that users can navigate the platform with zero friction while feeling the "premium" quality of a life-saving service. 

Key pillars include:
- **Clarity:** Unmistakable hierarchy and high-legibility typography.
- **Trust:** A clean, "sterile but warm" interface using soft grays and rounded forms.
- **Urgency:** Strategic use of deep reds to signal importance without inducing panic.

## Colors

The palette is anchored by **Medical Red**, used for primary actions and brand recognition. The background architecture relies on **Pure White** and **Soft Pearl Gray** to maintain a spacious, airy feel.

- **Primary (Medical Red):** Reserved for the most important calls to action (e.g., "Donate Now").
- **Secondary (Pearl Gray):** Used for surface backgrounds and subtle structural dividers.
- **Success Green:** Communicates eligibility, completed donations, and positive status.
- **Warning Orange:** Indicates moderate urgency or system alerts.
- **Emergency Crimson:** A darker, more serious red for life-critical "High Urgency" alerts and destructive actions.
- **Neutrals:** Deep slates and grays are used for typography to ensure maximum accessibility and reduced eye strain.

## Typography

This design system utilizes **Inter** across all levels. Inter is chosen for its exceptional legibility in medical contexts, specifically its tall x-height which aids in reading numerical data (like blood counts or hospital IDs).

- **Headlines:** Use Bold (700) weights with slight negative letter-spacing to appear authoritative and modern.
- **Body:** Regular (400) weight is the standard for long-form data or hospital descriptions to ensure maximum readability.
- **Labels:** Medium (500) and Semi-Bold (600) weights are used for UI metadata, status chips, and button text to provide clear contrast against body copy.

## Layout & Spacing

The system employs a **Fluid Grid** model. On desktop, a 12-column grid is used, while mobile scales down to a 4-column layout. 

- **Rhythm:** An 8px linear scale governs all padding and margins (4, 8, 16, 24, 48).
- **Mobile:** Content should reach within 16px of the screen edge. Cards should span the full width of the 4-column grid.
- **Desktop:** Generous 32px margins and 24px gutters provide a "premium" feel with significant "white space" to prevent the interface from feeling cluttered or clinical.
- **Admin Views:** For data-heavy tables, the spacing unit is reduced to 4px (tight) to maximize information density without sacrificing horizontal scanability.

## Elevation & Depth

Visual hierarchy in this design system is achieved through **Tonal Layering** and **Ambient Shadows**.

- **Level 0 (Background):** Pure White (#FFFFFF) or Soft Pearl Gray (#F5F7FA).
- **Level 1 (Cards):** White background with a soft, diffused shadow (0px 4px 20px rgba(0, 0, 0, 0.05)). This separates hospital data from the background.
- **Level 2 (Modals/Overlays):** Elevated with a more pronounced shadow (0px 10px 30px rgba(0, 0, 0, 0.1)) to draw focus during critical tasks.
- **Interactive States:** On hover, cards may lift slightly (Y-offset increases) to provide tactile feedback.

## Shapes

The shape language is defined by **Rounded (0.5rem / 8px)** corners as the base, scaling up for larger components.

- **Buttons & Inputs:** 8px (0.5rem) rounded corners for a modern, approachable feel.
- **Cards:** 16px (1rem) rounded corners (rounded-lg) to create a soft, premium container.
- **Badges/Chips:** Full pill-shaped (100px) to distinguish them from interactive buttons.
- **Containers:** Large section containers or bottom sheets use 24px (1.5rem) rounded corners (rounded-xl) on the top edges.

## Components

### Buttons
- **Primary:** Solid Medical Red (#C8102E) with white text. High emphasis.
- **Secondary:** Solid Pearl Gray (#F5F7FA) with Neutral (#1F2937) text. Low emphasis.
- **Emergency:** Outlined Emergency Crimson (#991B1B) with matching text. Used for "Request Emergency Blood."

### Inputs
- **Standard:** 1px border in Pearl Gray, 16px padding. 
- **Focus State:** Border changes to Medical Red with a 2px soft outer glow (glow-red-100).
- **Labels:** Positioned above the field in Label-MD Semi-bold.

### Badges (Status Chips)
- **High Urgency:** Emergency Crimson background (10% opacity) with solid Crimson text.
- **Eligible:** Success Green background (10% opacity) with solid Green text.
- **Pending:** Warning Orange background (10% opacity) with solid Orange text.

### Hospital Cards
- Elevated white surfaces with a vertical accent bar on the left (Primary Red).
- Use Headline-MD for Hospital names and Body-SM for addresses.
- Clear action buttons (Direction, Call) placed at the bottom-right.

### Navigation
- **Bottom Navigation (Mobile):** White background, 2px border-top in light gray. Icons are 2px stroke-based. Active state uses Medical Red for both icon and label; inactive states use medium gray.

### Tables & Lists
- **Admin View:** Use alternating row stripes in Pearl Gray (#F5F7FA) to maintain readability at high density. 
- **Row Height:** 48px to allow for comfortable touch targets on tablets while maintaining density.