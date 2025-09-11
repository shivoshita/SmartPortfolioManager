# Smart Portfolio Manager Dashboard Design Guidelines

## Design Approach
**Selected Approach:** Design System (Material Design + Finance Industry Standards)
**Justification:** This is a utility-focused, information-dense application where efficiency and learnability are paramount. Users need to quickly process financial data and make decisions.

## Core Design Elements

### A. Color Palette
**Light Theme (Primary):**
- Primary: 216 100% 50% (Professional blue)
- Success: 142 71% 45% (Financial green for gains)
- Error: 0 84% 60% (Red for losses)
- Background: 0 0% 98% (Clean white background)
- Surface: 0 0% 100% (Card backgrounds)
- Text Primary: 217 19% 27% (Dark blue-gray)
- Text Secondary: 217 10% 50% (Medium gray)
- Border: 217 12% 88% (Light gray borders)

### B. Typography
**Font Family:** Inter (Google Fonts)
- Headers: 600-700 weight, sizes 24px-32px
- Body: 400-500 weight, 14px-16px
- Financial data: 500-600 weight (tabular numbers)
- Captions: 400 weight, 12px-14px

### C. Layout System
**Spacing Units:** Tailwind units of 2, 4, 6, and 8
- Component padding: p-4, p-6
- Section margins: m-4, m-6, m-8
- Card spacing: gap-4, gap-6
- Grid gaps: gap-4

### D. Component Library

**Navigation:**
- Clean horizontal nav with subtle hover states
- Active link indicator with primary color underline
- Icon + text for main sections

**Cards:**
- Rounded corners (rounded-lg to rounded-xl)
- Soft shadows (shadow-sm to shadow-md)
- White backgrounds with subtle borders
- Consistent padding (p-4 to p-6)

**Data Tables:**
- Alternating row backgrounds for readability
- Right-aligned numerical data
- Color-coded indicators (green/red for gains/losses)
- Hover states for interactive rows

**Charts:**
- Clean grid lines and axes
- Professional color scheme matching palette
- Subtle animations on data load
- Responsive sizing for different screen sizes

**Widgets:**
- Drag handles with subtle visual indicators
- Consistent card styling across all widgets
- Clear visual hierarchy within each widget
- Loading states for data fetching

**Forms & Inputs:**
- Consistent border styling
- Focus states with primary color
- Clear validation feedback
- Proper spacing and alignment

### E. Financial Dashboard Specific Elements

**Data Visualization:**
- Use green for positive values, red for negative
- Consistent decimal places for financial figures
- Currency symbols and percentage indicators
- Clear trend indicators (arrows, icons)

**Portfolio Cards:**
- Large, prominent value displays
- Secondary metrics in smaller text
- Progress indicators for goals/benchmarks
- Quick action buttons where relevant

**Interactive Elements:**
- Subtle hover effects that don't distract
- Clear clickable areas
- Loading states for real-time data
- Tooltips for complex financial terms

## Layout Structure
- Fixed navigation header
- Main content area with responsive grid
- Customizable widget grid (3-4 columns on desktop)
- Sticky footer with minimal links
- Consistent margins and gutters throughout

## Accessibility & Responsiveness
- High contrast ratios for all text
- Keyboard navigation support
- Screen reader friendly data tables
- Mobile-responsive breakpoints
- Touch-friendly interactive elements on mobile

This design system prioritizes clarity, professionalism, and efficient data consumption while maintaining the clean, modern aesthetic expected in financial applications.