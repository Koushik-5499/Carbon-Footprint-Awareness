# Contributing to EcoTrack

Thank you for your interest in contributing to EcoTrack! By participating, you help build a cleaner, more sustainable community.

To ensure a smooth, collaborative process, please review and follow these contribution guidelines.

## Code of Conduct

We expect all contributors to adhere to a professional, respectful, and welcoming code of conduct. Please avoid offensive language, harassment, or unprofessional behavior in issues, pull requests, and commit logs.

## How to Contribute

### 1. Get Started
1. **Fork the Repository:** Create your own copy of this project on GitHub.
2. **Clone Locally:**
   ```bash
   git clone https://github.com/your-username/Carbon-Footprint-Awareness.git
   cd Carbon-Footprint-Awareness
   ```
3. **Install Dependencies:**
   ```bash
   npm install
   ```

### 2. Branching Strategy
We use the following branch prefix conventions:
- `feature/` for new features (e.g., `feature/smart-home-integration`)
- `bugfix/` for bug fixes (e.g., `bugfix/csp-error-fix`)
- `docs/` for documentation updates (e.g., `docs/add-api-endpoints`)
- `refactor/` for code refactoring and cleanups

Create your working branch from `main`:
```bash
git checkout -b feature/your-feature-name
```

### 3. Coding Style & Guidelines
- **ES6+ Best Practices:** Use standard modern JavaScript conventions (const/let, arrow functions, destructuring, and async/await).
- **Separation of Concerns:** Keep business logic in controllers, routes in routes files, and style definitions in `frontend/css/style.css`.
- **JSDoc Annotation:** Document all new controllers and middleware functions with JSDoc headers.
- **XSS & Security Sanitization:** Ensure all new input routes utilize `express-validator` and that any dynamic DOM rendering in the frontend escapes input text using `window.escapeHTML()`.

### 4. Running Tests
All contributions must pass existing tests and include tests for new logic:
```bash
# Run tests and collect coverage report
npm test
```
Assert that coverage on new files remains at 100% and that Jest exits cleanly without open handle warnings.

### 5. Submit a Pull Request
1. Commit your changes with descriptive messages:
   ```bash
   git commit -m "Add smart-home energy calculator route"
   ```
2. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
3. Open a Pull Request (PR) on GitHub against our `main` branch.
4. Describe your changes clearly and link any related issues.
