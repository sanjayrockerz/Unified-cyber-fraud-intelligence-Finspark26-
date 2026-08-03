# Fuzen AI — Design System Report

## Existing system retained

The implementation continues to use the repository's semantic SOC tokens, shared badges, cards, focus rings, responsive grids, dark/light theme variables, and reduced-motion rules.

## New reusable seam

`web/src/components/common/InvestigationCard.jsx` centralizes investigation-card interaction behavior instead of duplicating expand, copy, timestamp, loading, and status treatment in each Copilot section.

## Accessibility

Controls have explicit labels, expandable regions expose `aria-expanded`, loading and errors expose accessible labels/roles, and the query input is associated with a screen-reader label.

