# Offtasks first-run onboarding

## Direction

Three short illustrated steps: capture in Later, plan with Calendar, and personalize Goals / keep Notes. Each page has one heading and one short description. The footer contains tappable progress dots, one primary action, and a centered Skip link beneath it (Close when replaying). Sign in sits at the top right for guests. Get started opens the device-local workspace; account creation is available from Sign in. Forest green, sage, tactile paper, restrained glass; gentle ease-in/out with Reduce Motion support.

## Routes and data safety

- New guests see Welcome once per device; existing signed-in sessions go to Home.
- Menu → Welcome to Offtasks replays the introduction without clearing data or logging out.
- Welcome and Account are full-screen root-stack destinations outside the shared header / bottom dock shell.
- The shared dock also checks planner focus, so it is removed while a root-stack screen covers Home and restored on return.
- Sign-up, sign-in, and email-only reset share the standalone account screen. Confirmation explains the email step; errors are inline and requests are locked against duplicates.
- Guest data remains local. Account → Import device items is still explicit, confirmed and non-destructive; signing in does not silently merge items.
- Guests with existing content see an optional import review after signing in. Empty guests and restored account sessions go straight to the main app. Unreadable device storage never blocks authentication.
- Account changes do not replay the startup splash.
- No sample tasks, goals or notes are injected into the real workspace.

## Illustration assets

Generated with the built-in image generation tool (not CLI). Transparent PNG originals copied into `src/assets/onboarding/`. No customer content was sent. Final prompts:

### capture.png

Use case: stylized-concept. Create original square transparent-alpha onboarding illustration for Offtasks. Adult premium editorial 3D paper still-life: three small folded ivory and sage paper slips gently suspended over a shallow deep forest green rounded-square ceramic tray. One slip has a simple tiny embossed rounded-square check shape. Represents collecting loose thoughts for later. Tactile soft paper, subtle warm studio shadows, restrained forest green #152D25, sage, warm ivory, tiny muted apricot accent. A small translucent green glass pebble beside the tray. Compact centered composition generous transparent margins. Beautiful sculptural real-material detail, slightly elevated camera. No lettering, no numbers, no logo, no background rectangle, no watermark. Genuinely transparent background with alpha. Cohesive calm companion to a paper-calendar onboarding illustration.

### calendar.png

Use case: stylized-concept. Asset type: original onboarding illustration for Offtasks mobile, a calm forest-green personal planning app. Create one square editorial 3D still-life on genuinely transparent background, alpha preserved: a softly rounded ivory calendar tile with a simple abstract seven-column date grid and one deep forest green selected square, a small sage folded note resting beside it, and a delicate translucent green circular glass pebble in the foreground. Compact sculptural composition centered with generous transparent margins, perspective slightly above, tactile paper and frosted glass, subtle realistic ambient shadows, warm natural studio lighting. Premium, calm, playful but adult; inspiration is the user's preference for Tesla's high-quality illustration and Acorns' approachable visual storytelling, not their actual branding. Forest green #152D25, sage, ivory and a tiny muted apricot accent. No words, no numbers, no logos, no watermark, no app screenshot, no background rectangle. This illustration will sit above concise text explaining tasks, dates, notes and goals.

### grow.png

Use case: stylized-concept. Original square onboarding illustration for Offtasks personal planning mobile app. Genuinely transparent alpha background. Premium adult editorial 3D still-life: a small beautifully bound sage notebook with ivory page edges standing half-open, next to a sculptural deep forest-green arch holding a tiny soft apricot sphere at its summit, like a reachable milestone. Two ivory paper steps lead toward the arch. One tiny translucent sage glass pebble at base. Represents personal notes and progressing toward goals. Tactile paper, ceramic and subtle frosted glass, warm studio lighting, soft realistic contact shadows, elevated camera, compact centered composition with transparent margins. Calm, thoughtful, quietly playful. Colors forestgreen #152D25 sage ivory tiny apricot. Cohesive companion to paper calendar and note-catching ceramic tray illustrations. No words, no letters, no numbers, no logos, no watermark, no background rectangle.
