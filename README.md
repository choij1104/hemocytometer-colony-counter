# Bench Tally

Count right on the instrument. A single-file, offline web app for the bench:

- **Hemocytometer**: an improved Neubauer ruling drawn to scale. Tap cells as live or dead on any large square, or count the center five 0.2 mm squares for small cells. The edge convention is selectable. The dilution factor is built from the volumes you actually mixed (pre-dilution × trypan blue). Outputs live and total cells/mL, viability, and cells in suspension.
- **Plates (CFU)**: a dilution train built from your transfer and diluent volumes, with duplicate plates under each tube. Tap colonies on a drawn agar plate, or type counts (TNTC accepted). The calculation follows the FDA BAM Chapter 3 aerobic plate count rules: 25–250 range, N = ΣC / [(1×n1)+(0.1×n2)]×d, two-significant-figure rounding, and the <, *, EAPC and TNTC cases.
- **Seeding**, **C1V1 and serial dilution**, **molar / % w/v / mg/mL solutions**, **RPM ↔ RCF**, **doubling time**, and **OD600** (with your own calibration; no default is assumed).

No network requests, no account. Entries are kept only in this browser.

## Sources
- U.S. FDA. *Bacteriological Analytical Manual*, Chapter 3: Aerobic Plate Count.
- Merck. Cell quantification (trypan blue 1:1, dilution factor 2; count more than 100 cells).
- INTEGRA Biosciences. Cell counting with a hemocytometer (chamber geometry; edge convention).

Items tagged **LOCAL** in the app (CV > 30 %, viability < 80 %, pipetting margin, OD > 1.0 linearity) are working defaults, not method requirements.

## Verification
25 scripted checks against hand-calculated answers (`tests/check.js`, Playwright). They include the FDA BAM worked example (537 / 0.022 = 24,409 → 24,000), the odd/even rounding rule, the no-colony and all-below-range cases, the center-five mode, and a non-decimal dilution series.

## Changelog
**v0.1.0**, 2026-10-26: first release.

HAKOYA LLC · Auravyx Systems · Selma, Texas
