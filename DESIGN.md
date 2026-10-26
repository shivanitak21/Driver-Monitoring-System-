---
name: VMS
description: A live vehicle on a quiet map, read like an automotive instrument.
colors:
  lime: "#D7F76B"
  lime-ink: "#1A1E0C"
  signal-on-paper: "#4C6110"
  amber: "#E6B15A"
  amber-on-paper: "#8A5A10"
  danger: "#FF453A"
  danger-on-paper: "#D1261E"
  danger-soft: "#FF8A80"
  danger-soft-on-paper: "#A3201A"
  on-danger: "#FFFFFF"
  cyan: "#8FD4D0"
  cyan-on-paper: "#1F6F6A"
  graphite: "#090A0C"
  graphite-raised: "#14171C"
  graphite-soft: "#1C2128"
  graphite-chip: "#2A3038"
  ink: "#F5F6F7"
  ink-muted: "#A1A6AF"
  ink-faint: "#8B929C"
  line: "rgba(255,255,255,0.10)"
  line-strong: "rgba(255,255,255,0.18)"
  glass: "rgba(16,18,22,0.78)"
  glass-tint: "rgba(9,10,12,0.42)"
  map-ground: "#101216"
  scrim: "rgba(0,0,0,0.58)"
  shadow: "#000000"
  paper: "#F3F4F6"
  paper-raised: "#FFFFFF"
  paper-soft: "#E6E9ED"
  ink-on-paper: "#17191D"
  ink-muted-on-paper: "#5C6370"
  ink-faint-on-paper: "#6A7180"
  line-on-paper: "rgba(23,25,29,0.08)"
  line-strong-on-paper: "rgba(23,25,29,0.14)"
  glass-on-paper: "rgba(255,255,255,0.84)"
  glass-tint-on-paper: "rgba(255,255,255,0.55)"
  map-ground-light: "#E4E7EB"
  scrim-on-paper: "rgba(23,25,29,0.32)"
  shadow-on-paper: "rgba(23,25,29,0.16)"
  marker-pearl: "#F4F6F8"
  marker-edge: "#C5CCD4"
  marker-cabin: "#1A1E24"
  marker-roof: "#E7EAEF"
  marker-tire: "#22262C"
typography:
  display:
    fontFamily: "Sora, sans-serif"
    fontSize: "34px"
    fontWeight: 600
    letterSpacing: "-0.9px"
  title:
    fontFamily: "Sora, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    letterSpacing: "-0.6px"
  metric:
    fontFamily: "Sora, sans-serif"
    fontSize: "26px"
    fontWeight: 500
    letterSpacing: "-0.6px"
    fontFeature: "tabular-nums"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "21px"
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    letterSpacing: "0.1px"
  strong:
    fontFamily: "Manrope, sans-serif"
    fontSize: "16px"
    fontWeight: 600
  caption:
    fontFamily: "Manrope, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "18px"
rounded:
  md: "16px"
  lg: "22px"
  xl: "28px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  button-lime:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.lime-ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "48px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "48px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-danger}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "48px"
  button-quiet:
    backgroundColor: "{colors.graphite-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "48px"
  button-icon:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink}"
    rounded: "24px"
    size: "48px"
  field:
    backgroundColor: "{colors.graphite-raised}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "14px"
    padding: "0 14px"
    height: "48px"
  glass-card:
    backgroundColor: "{colors.glass}"
    rounded: "{rounded.lg}"
    padding: "16px"
  dock:
    backgroundColor: "{colors.glass}"
    rounded: "26px"
    padding: "0 6px"
    height: "62px"
  dock-tab-active:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.lime-ink}"
    rounded: "18px"
    height: "48px"
  segmented:
    backgroundColor: "{colors.graphite-soft}"
    rounded: "14px"
    padding: "3px"
  status-pill:
    backgroundColor: "{colors.graphite-soft}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "6px 10px"
  sos-button:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-danger}"
    rounded: "26px"
    size: "52px"
  navigation-marker:
    backgroundColor: "{colors.marker-pearl}"
    size: "72px"
    width: "84px"
    height: "84px"
---

# Design System: VMS

## Overview

**Creative North Star: "The Quiet Instrument"**

VMS is a quiet automotive instrument for one live ride. The vehicle is a navigation chevron on a muted map, and the chrome around it is either graphite or cool gray, with lime reserved for the selected tab, a safe signal, and the chevron's nose. Dark graphite is the boot palette and the default until a saved appearance is read. Light is the same structure on cool paper, with darker signal, amber, danger, and cyan so status stays readable. Sora carries titles and metrics. Manrope carries everything a person reads or taps.

Depth is tonal. Page groups, sheets, and the SOS confirmation are opaque raised fills with a hairline. Blurred glass is limited to chrome that floats: the live identity, the alert popover, the telemetry card, the dock, and call permission panels. Presses scale down and fire a selection haptic. The safety ring eases over 700ms, the telemetry card fades up over 480ms, and the SOS ring pulses over 1400ms. All three yield when the platform asks for reduced motion.

**Key Characteristics:**

- Graphite dark and cool-gray light, with lime as the instrument accent
- Sora for titles and metrics, Manrope for UI
- Blurred glass only on floating chrome, the dock, and call panels
- Navigation chevron marker with a fixed ground shadow
- Circular controls and a floating five-tab dock

## Colors

The palette is a graphite instrument in the dark and a cool-gray instrument in the light. Lime is the only brand accent. Status colors ship as a light value on graphite and a darker value on paper. Component snippets in the sidecar resolve to the dark boot palette.

### Primary

- **Lime Instrument** (`lime`): Fill for the active dock tab, a switch that is on, a non-urgent alert count, and the navigation chevron's nose. On graphite it is also the live dot and the safe signal, including the trail. Occupied seats and the cabin status use a soft tint or the signal color, not a lime fill.
- **Lime Ink** (`lime-ink`): Text and icons on any lime fill. The same value in both themes.
- **Signal on Paper** (`signal-on-paper`): The light-theme reading of the safe and live signal. Use it for status strokes, the trail, and signal-colored labels on paper. Do not use `lime` for those strokes on paper.

### Secondary

- **Amber Instrument** (`amber`): Caution status and the offline switch track, on graphite.
- **Amber on Paper** (`amber-on-paper`): The same caution role on the light theme.
- **Danger** (`danger`): Emergency status, the SOS control, destructive buttons, and the open-alert dot.
- **Danger on Paper** (`danger-on-paper`): Emergency on the light theme.
- **Danger Soft** (`danger-soft`): A quieter danger label on graphite.
- **Danger Soft on Paper** (`danger-soft-on-paper`): The quieter danger label on paper.
- **On Danger** (`on-danger`): Text on danger fills. White in both themes.

### Tertiary

- **Cyan Instrument** (`cyan`): The destination dot on the dark map.
- **Cyan on Paper** (`cyan-on-paper`): The destination dot on the light map.

### Neutral

- **Graphite** (`graphite`): Page and app background in the dark theme, including the boot screen before appearance is read.
- **Raised Graphite** (`graphite-raised`): Opaque cards, sheets, the SOS confirmation, grouped rows, field fill, and the page back control.
- **Soft Graphite** (`graphite-soft`): Quiet button fill, segmented track, status pill fill, and the off state of a switch track.
- **Chip Graphite** (`graphite-chip`): The selected segment on graphite.
- **Pearl Ink** (`ink`): Primary text on graphite.
- **Muted Steel** (`ink-muted`): Body text and inactive dock labels on graphite.
- **Faint Steel** (`ink-faint`): Labels, captions, placeholders, and the route-origin dot on graphite.
- **Hairline** (`line`): 1px borders on glass, fields, cards, and icon buttons in the dark theme.
- **Strong Hairline** (`line-strong`): Ghost-button borders and the safety-ring track on graphite.
- **Glass** (`glass`): Fill of the blurred shell, and the offline chip fill. Dark theme.
- **Glass Tint** (`glass-tint`): The tint laid over the blur. Dark theme.
- **Map Ground** (`map-ground`): The live map's own background before tiles paint. Dark theme.
- **Scrim** (`scrim`): The dim layer behind the SOS confirmation.
- **Shadow** (`shadow`): Dock shadow color on graphite.
- **Cool Paper** (`paper`): Page background in the light theme.
- **Raised Paper** (`paper-raised`): Opaque cards, sheets, chips, and switch thumbs in the light theme.
- **Soft Paper** (`paper-soft`): Quiet fills and the segmented track in the light theme.
- **Graphite Ink** (`ink-on-paper`): Primary text on paper.
- **Cool Muted** (`ink-muted-on-paper`): Body text on paper.
- **Cool Faint** (`ink-faint-on-paper`): Labels and placeholders on paper.
- **Paper Hairline** (`line-on-paper`) and **Paper Strong Hairline** (`line-strong-on-paper`): The light-theme borders.
- **Paper Glass** (`glass-on-paper`) and **Paper Glass Tint** (`glass-tint-on-paper`): The light-theme glass shell.
- **Map Paper** (`map-ground-light`): The live map background in the light theme.
- **Paper Scrim** (`scrim-on-paper`) and **Paper Shadow** (`shadow-on-paper`): Light-theme dimming and the dock shadow color.
- **Marker Pearl** (`marker-pearl`) and **Marker Edge** (`marker-edge`): The navigation chevron's fill and outline. These do not follow the theme swap. The nose uses `lime`.

### Named Rules

**The Lime Instrument Rule.** Lime marks the selected dock tab, an on switch, and the chevron nose. On graphite the live dot and the safe signal are the same lime. On paper, status strokes use signal-on-paper. Cabin seats, the driver-state pill, and Record stay quiet. Lime is not a page or map background.

**The Paired Semantic Rule.** Amber, danger, danger-soft, and cyan each have a graphite value and a darker paper value. Render the pair that matches the active scheme. The light theme is a full palette, not the dark palette with a white background.

## Typography

**Display Font:** Sora (sans-serif), loaded as Sora 600 for display and titles and Sora 500 for metrics.

**Body Font:** Manrope (sans-serif), loaded as Manrope 400, 500, and 600.

**Character:** Sora is the instrument face: tight tracking, used for the call clock, page titles, and numbers. Manrope is the UI face: labels, captions, body, and every button.

### Hierarchy

- **Display** (Sora 600, 34px, tracking -0.9px): The call clock and the call phase. Nowhere else.
- **Title** (Sora 600, 28px, tracking -0.6px): Page titles, the SOS confirmation title, sheet titles, and screen-state titles. The live telemetry name is this face at 22px. Trip detail titles also step down to 22px.
- **Metric** (Sora 500, 26px, tracking -0.6px, tabular figures): Standalone instrument numbers. On the live card and the vehicle stats the size steps to 22px, and trip summaries use 20px. The face and the tabular figures stay.
- **Body** (Manrope 400, 15px, line height 21px): Supporting sentences. Color is muted steel, or cool muted on paper. Screen-state body stops at 320px wide.
- **Label** (Manrope 500, 13px, tracking 0.1px): The caption above a metric, in faint steel.
- **Strong** (Manrope 600, 16px): Names, row titles, and button labels. Buttons draw this face at 15px.
- **Caption** (Manrope 500, 13px, line height 18px): Secondary lines, dock labels, and status pills. Dock labels step to 11px. The SOS label is this size at Manrope 600 with tracking 0.6px.

### Named Rules

**The Two Faces Rule.** Sora is for titles and metrics. Manrope is for body, labels, captions, and controls. Do not set a metric in Manrope or a button in Sora.

## Layout

The app has two planes.

The live plane is a full-bleed map. Identity, tools, and the telemetry card sit in 16px side insets. The identity row clears the top safe area by 8px. The telemetry stack sits just above the dock. The dock's clearance is 84px plus the bottom safe area, and at least 10px. Map follow frames the vehicle with a latitude delta of 0.028, biased upward, animated over 700ms. A large jump uses 0.04. Reduced motion sets that duration to 0. The map does not rotate or pitch, and it hides the compass and the my-location button. On iOS the map type is muted standard and follows the scheme. On Android the Google map uses the quiet custom style, with points of interest and transit hidden. The planned route is a 3px line of pearl ink at 38% on graphite and graphite ink at 28% on paper. The traveled trail is a 4px signal stroke.

The page plane is every other screen. The fill is graphite or paper. The header insets 20px on the sides, sits 8px below the top safe area, and places a 48px back circle beside the title when the screen can go back. Scroll content uses the same 20px inset and clears the dock, or the bottom safe area plus 28px when the dock is absent. Stack screens slide in from the right. There is no breakpoint scale. The vehicle sheet's photos are 72% of the window width.

Gaps of 12px recur between rows and stats. Card padding is 16px. The 4, 8, 12, 16, 24, and 32px steps are the spacing scale; screens apply them as literals. The 20px page inset and occasional 10px and 14px gaps sit beside that scale.

### Named Rules

**The Two Planes Rule.** The live ride is the map, with floating chrome inset 16px. Every other screen is a filled page with a 20px side inset, a Sora title, and a scroll that clears the dock.

## Elevation & Depth

Depth is mostly tonal: graphite, then raised graphite, then soft graphite, and the same three steps on paper. Borders are 1px hairlines, not shadows. The dock is the only box shadow: color from `shadow` or `shadow-on-paper`, offset 0 10, opacity 0.28, radius 18, elevation 8. The chevron's contact shadow is a separate ellipse under the marker, not part of this vocabulary. The SOS confirmation dims the map with the scrim. Sheets use a backdrop at about 55% opacity and a raised fill with a 28px top radius.

Blurred glass is a shell: 1px hairline, fill from `glass`, a blur at intensity 36, then a tint from `glass-tint`. Default corner is 22px. The offline chip uses the glass fill and a hairline and does not blur.

### Shadow Vocabulary

- **Dock drop** (`0 10px 18px rgba(0,0,0,0.28)` on graphite): The floating tab bar only. On paper the shadow color is `shadow-on-paper` at the same offset, opacity, and radius.
- **Sedan contact** (ellipse, `rgba(0,0,0,0.22)`, about 40 by 64 in the 96 viewBox): Fixed under the car. It does not rotate with heading.

### Named Rules

**The Glass Ceiling Rule.** The blurred glass shell is the live identity pill, the alert popover, the telemetry card, the dock, and call permission panels. Page groups, the vehicle sheet, and the SOS confirmation stay opaque raised fills with a hairline.

**The Reduced Motion Rule.** When the platform reports reduced motion, the SOS pulse is omitted, the safety ring snaps to its value, the telemetry card does not fade in, and map follow animation duration is 0.

## Shapes

Corners come from a short scale: 16px on buttons, 22px on cards, groups, and the default glass shell, 28px on the telemetry card, the vehicle sheet top, the SOS confirmation, and the call frame. Fields and the segmented track use 14px, with the selected segment inset to 11px. Status pills, the offline chip, and evidence chips are full pills. Map tools, the page back control, and call mute are 48px circles. SOS is a 52px circle. The dock is a 26px capsule, 62px tall, and each tab is an 18px rounded cell. Seat tiles use 18px. Avatars are circles.

Hairlines are 1px. The safety ring is a 3.5px round-capped stroke on a strong hairline track.

### Named Rules

**The Circle Control Rule.** A tappable icon on the map, in the page header, or on a call is a 48px circle. SOS is the 52px exception. Rectangular buttons stay on the 16px radius and at least 48px tall. Segment cells and screen-state actions stay at least 44px tall.

## Components

### Buttons

Pressed buttons fade to opacity 0.82 and scale to 0.98. Disabled buttons sit at opacity 0.4. A selection haptic fires on press. Labels are Manrope 600 at 15px.

- **Shape:** Gently rounded rectangle (16px radius), minimum height 48px, horizontal padding 16px.
- **Primary:** Lime fill, lime-ink label.
- **Hover / Focus:** The app has no hover. Press is the feedback above. Ghost buttons use the strong hairline.
- **Ghost:** Transparent fill, strong hairline, ink label.
- **Quiet:** Soft graphite fill, ink label. Used when an action is available but not primary.
- **Danger:** Danger fill, on-danger label.

### Icon Buttons

- **Shape:** 48px circle.
- **Fill:** Glass, with a 1px hairline. The page back control uses raised graphite instead of glass, because it sits on a page, not on the map.
- **Mark:** 18px line icon, stroke 1.75, ink. Recenter uses the signal color while follow is on.
- **Press:** Opacity 0.82 and scale 0.96, plus a selection haptic.

### Chips

- **Style:** Status pills are soft-graphite capsules with 10px horizontal and 6px vertical padding, a 6px status dot, and a caption in the status color. Safe is signal, caution is amber, emergency is danger.
- **State:** The offline chip is a glass-filled pill with a hairline and an ink caption reading "Offline". Alert counts on the map tools are 16px circles, lime with lime ink, or danger with on-danger when the alert is urgent.

### Cards / Containers

- **Corner Style:** 22px for page groups and cards. 28px for the telemetry card, the sheet top, and the SOS confirmation.
- **Background:** Raised graphite, or raised paper in the light theme. The telemetry card is glass.
- **Shadow Strategy:** None on cards. The dock carries the only box shadow.
- **Border:** 1px hairline.
- **Internal Padding:** 16px on cards and padded glass. Grouped rows use 16px horizontal and 14px vertical padding.

### Inputs / Fields

- **Style:** 48px tall, 14px radius, 1px hairline, 14px horizontal padding, raised fill, Manrope 400 at 15px, ink text.
- **Placeholder:** Faint steel.
- **Focus:** The field does not change its border when focused.
- **Switches:** Track is lime when on and soft graphite when off. The offline override uses amber for the on track. The thumb is the raised fill.

### Navigation

The dock floats over content, inset 16px from the sides, with at least 10px above the bottom safe area. It is a 62px glass capsule at 26px radius. Five tabs: Live, Trips, Cabin, Alerts, Family. The active tab is a lime cell with lime-ink icon and an 11px caption. Inactive tabs use muted steel. Icons are 18px at stroke 1.75. Alerts shows a 6px danger dot when any alert is unacknowledged. A selection haptic fires on tab press. The active cell radius is 18px.

### Segmented Control

A soft-graphite track with 3px padding and a 14px radius. Each item is at least 44px tall with an 11px radius. The selected item uses the chip fill, a hairline, and ink text. Unselected text is muted.

### Safety Ring

A circular instrument, 58px by default and 52px on the live card. The track is the strong hairline. The progress stroke is 3.5px, round-capped, and colored by status: signal, amber, or danger. The center number is Manrope 600 at 16px with tabular figures. The live card captions it "Safety score". Progress eases out over 700ms, or snaps when reduced motion is on.

### SOS

A 52px danger circle with an on-danger "SOS" label in Manrope 600 at 13px, tracking 0.6px. Press scales to 0.96 and fires a heavy haptic. A pulse behind it scales from 1 to 1.16 and back over 1400ms, with opacity equal to 2 minus the scale, and is omitted when reduced motion is on. The confirmation that follows is an opaque raised card at 28px radius on the scrim, not a second glass layer.

### Navigation Marker

The vehicle on the map is a navigation chevron drawn in a 96-unit box, shown at 72px inside an 84px hit target. The tip points north at heading 0 and rotates with heading around the center. A contact ellipse under the chevron does not rotate in the keyed map. Fill is marker pearl with a marker-edge stroke. The nose is lime. On the native map the marker is flat and also receives the heading as marker rotation. Tapping it opens the vehicle.

## Do's and Don'ts

### Do:

- **Do** boot on graphite, and treat light as a full cool-gray palette with its own signal, amber, danger, danger-soft, and cyan.
- **Do** keep primary buttons at 48px height, 16px radius, lime fill, and lime-ink labels in Manrope 600 at 15px.
- **Do** float the dock, the live identity, and the telemetry card in blurred glass over the map.
- **Do** draw the navigation chevron at 72px inside an 84px target, with the ground shadow fixed and the body rotated to heading.
- **Do** set metrics in Sora 500 with tabular figures, and body copy in Manrope 400 at 15px with 21px line height.

### Don't:

- **Don't** paint page cards, the vehicle sheet, or the SOS confirmation with blurred glass.
- **Don't** use lime as a page or map background, or as a status stroke on the light theme.
- **Don't** put a sedan illustration, an emoji, or a photograph on the map. The marker is the navigation chevron.
- **Don't** add a hard offset shadow. The dock's soft drop is the only box shadow.
- **Don't** set a typeface other than Sora for titles and metrics, or other than Manrope for UI text.
