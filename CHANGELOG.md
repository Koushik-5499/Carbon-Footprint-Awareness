# Changelog

All notable changes to the EcoTrack project will be documented in this file. This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-06-21

### Added
- **Security Validation:** Integrated `express-validator` on all calculator, challenge, AI, and admin routes.
- **XSS Mitigations:** Implemented a global `escapeHTML` helper in frontend scripts to prevent XSS during DOM rendering (e.g. chat messages, leaderboard, and admin tables).
- **Security Hardening:** Installed and configured `helmet` with strict Content Security Policy, `hpp` middleware, and split rate limiters.
- **Performance Optimizations:** Added stats caching in `adminController.js` and Gzip response compression.
- **Accessibility:** Bound dynamic `aria-invalid` states on form validation failures in the calculator.
- **Automated Testing:** Achieved 100% code coverage on all backend modules (controllers, routes, middleware, and helpers). Fixed Jest worker socket leak by throwing an error in the `process.exit()` mock implementation.
- **Documentation:** Created `SECURITY.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `LICENSE`, and `TESTING.md`.

### Removed
- **Inline Styles:** Extracted all inline styles from frontend HTML pages to `frontend/css/style.css`.
- **Dead Code:** Cleaned up unused style parameters and redundant backend logging.

## [1.0.0] - 2026-06-19

### Added
- **Initial Release:** Carbon Footprint Awareness platform featuring:
  - Daily footprint calculator (Transport, Electricity, Water, Gas, Waste).
  - Glassmorphic user dashboard with Chart.js visualization.
  - Actionable sustainability recommendations and chat assistant (Pollinations.ai integration).
  - Daily and weekly eco challenges.
  - Global leaderboard rankings.
  - PDF report download utility.
  - Admin statistics and challenges management.
  - Local JSON database storage.
