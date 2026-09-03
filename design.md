# Snip Design System

Compact, dark, spacious UI with a warm ambient hero glow and a centered prompt-style URL composer.

## Tokens

- Background: `#08070a` app base, `#111016` elevated base.
- Surface: `rgba(255,255,255,0.07)` cards, `rgba(255,255,255,0.11)` composer, `rgba(255,255,255,0.04)` table rows.
- Text: `#fbfaf8` primary, `#d7d0ca` secondary, `#928983` muted.
- Accent gradient: `linear-gradient(135deg, #ff6f61 0%, #ff4fa3 45%, #ffb35c 100%)`.
- Feedback: success `#5ff0a5`, error `#ff8f8f`, feedback surfaces use matching 12% tints.
- Font stack: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- Type scale: eyebrow `0.78rem`, body `1rem`, lead `1.15rem`, h2 `1.2rem`, hero `clamp(3rem, 9vw, 6.8rem)`.
- Spacing: page gutters `24px`, section gap `28px`, card padding `clamp(22px, 4vw, 36px)`, hero top/bottom `72px/36px`.
- Radius: composer `999px`, buttons `999px`, cards `28px`, notices `20px`, table rows `18px`.
- Borders: `1px solid rgba(255,255,255,0.12)` with brighter focus `rgba(255,255,255,0.28)`.
- Shadows/glow: cards `0 24px 80px rgba(0,0,0,0.32)`; hero glow uses blurred coral/pink/orange radial gradients behind content.

## Snip Mapping

- Page header: centered hero with small Snip eyebrow, bold headline, muted subline, and warm glow behind it.
- URL form: oversized pill composer as the centerpiece; text input fills the pill and primary action is attached on the right.
- Result notice: compact rounded success surface below composer with the short URL highlighted.
- Error notice: compact rounded error surface below composer with direct inline copy.
- Links table: generous rounded glass card with subtle borders, muted headings, warm hover rows, and linked short codes.
