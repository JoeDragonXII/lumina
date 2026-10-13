# Lumina UI

Prefer the local Aceternity-style components in this directory before creating another visual treatment. They use the shared photographic palette in `frontend/app/design-tokens.css`; do not add a separate blue/purple palette to individual components.

## Component choices

| Need | First choice | Notes |
| --- | --- | --- |
| Navigation | `FloatingDock` | Warm active state; keyboard labels; restrained magnification. |
| Photo / collection card | `BeamCard` | No default padding around images. Use `contentClassName` for padded content. |
| Informational card / grid | `HoverCard`, `GridFeatures` | Reuse BeamCard materials. |
| Filter groups | `SegmentedControl` | Native toggle buttons and an animated selection; not a tab panel. |
| Actions / fields | `Button`, `Input`, `Textarea`, `Select` | Native form semantics, themed borders, focus, disabled and danger states. |
| Photo viewer | `PhotoCardDialog` | Shared by map, gallery, archive and accepted preview. Native modal, adaptive image and EXIF rail. |
| Atmospheric background | `AuroraBackground` | Muted sage / warm glow; stops animating for reduced motion and hidden tabs. |
| Timeline | `TimelineShowcase` | Shared colors for nodes and trace. |

MapLibre markers, collision grouping, geographic shapes, file import and data-management workflows remain specialized components. Compose their shells with the shared components/tokens rather than replacing the underlying behavior with a decorative UI demo.

## Materials

- Background `--ui-bg`; surfaces `--ui-surface` / `--ui-surface-raised`; translucent panels `--ui-surface-glass`.
- Text `--ui-ink` / `--ui-muted`; warm accent `--ui-accent` / `--ui-accent-soft`; quiet sage `--ui-sage`.
- Radius 10 / 16 / 24 px; photo corners 12 px; spacing 4 / 8 / 12 / 16 / 24 / 32 px.
- System sans for UI; Georgia / Noto Serif SC for photographic headings; `--ui-font-mono` for EXIF and coordinates.
- Keep photos dominant. Do not add descriptive placeholders or invented EXIF. Missing metadata is omitted.
- Use 44 px targets, visible focus, native labels, reduced-motion support, and loading/error/empty states.

## References

The local components are adapted to Lumina's architecture and colors. New controls are original implementations of the visual patterns, not a new npm dependency or wholesale imported registry.

- [Aceternity Floating Dock](https://ui.aceternity.com/components/floating-dock)
- [Aceternity Hover Border Gradient](https://ui.aceternity.com/components/hover-border-gradient)
- [Aceternity Signup Form](https://ui.aceternity.com/components/signup-form)

The preview's generated photos remain preview-only. `/map` reads public collections and media variants from the existing repository.
