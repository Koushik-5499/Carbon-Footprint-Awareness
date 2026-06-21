# Testing Strategy & Architecture

EcoTrack features a robust, automated test suite utilizing **Jest** and **Supertest** to verify all APIs, mock external endpoints, and handle boundary exceptions.

## Test Directory Structure

```
├── tests/
│   ├── __mocks__/
│   │   └── uuid.js             # Deterministic UUID mock
│   ├── admin.test.js           # Admin stats and challenge management
│   ├── ai.test.js              # Mocks Pollinations.ai API ask/recommend endpoints
│   ├── auth.test.js            # Authentication registration & profile fetch
│   ├── calculator.test.js      # Carbon calculations logic & negative fields
│   ├── challenges.test.js      # Challenge listings & completion scores
│   ├── exceptions.test.js      # Page routes, validations, expired tokens & leaks
│   └── leaderboard.test.js     # Top users rankings & caching
```

## Running Tests

Run the full automated test suite and generate a code coverage report with:
```bash
npm test
```

## Coverage Report Summary

All core business modules (controllers, routes, middleware, configurations, and file helper utilities) are covered at exactly **100% statement, branch, function, and line coverage**:

```
---------------------------|---------|----------|---------|---------|-------------------
File                       | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
---------------------------|---------|----------|---------|---------|-------------------
All files                  |   99.52 |    95.93 |   97.91 |    99.5 |                   
 backend                   |   97.84 |    84.37 |    92.3 |   97.84 |                   
  server.js                |   97.84 |    84.37 |    92.3 |   97.84 | 176-177           
 backend/config            |     100 |      100 |     100 |     100 |                   
  constants.js             |     100 |      100 |     100 |     100 |                   
 backend/controllers       |     100 |      100 |     100 |     100 |                   
  adminController.js       |     100 |      100 |     100 |     100 |                   
  aiController.js          |     100 |      100 |     100 |     100 |                   
  authController.js        |     100 |      100 |     100 |     100 |                   
  calculatorController.js  |     100 |      100 |     100 |     100 |                   
  challengeController.js   |     100 |      100 |     100 |     100 |                   
  leaderboardController.js |     100 |      100 |     100 |     100 |                   
 backend/middleware        |     100 |      100 |     100 |     100 |                   
  authMiddleware.js        |     100 |      100 |     100 |     100 |                   
 backend/routes            |     100 |      100 |     100 |     100 |                   
  adminRoutes.js           |     100 |      100 |     100 |     100 |                   
  aiRoutes.js              |     100 |      100 |     100 |     100 |                   
  authRoutes.js            |     100 |      100 |     100 |     100 |                   
  calculatorRoutes.js      |     100 |      100 |     100 |     100 |                   
  challengeRoutes.js       |     100 |      100 |     100 |     100 |                   
  leaderboardRoutes.js     |     100 |      100 |     100 |     100 |                   
 backend/utils             |     100 |      100 |     100 |     100 |                   
  fileHelpers.js           |     100 |      100 |     100 |     100 |                   
---------------------------|---------|----------|---------|---------|-------------------
```
*Note: The only uncovered lines in `backend/server.js` are 176–177, which run the live HTTP listener when `process.env.NODE_ENV !== 'test'`. This is correct by design so Jest test workers don't lock ports.*

## Mocking Strategies & Isolation

1. **Local Filesystem Mocking:**
   - Instead of writing dummy entries to `data/users.json` or `data/challenges.json`, the filesystem calls (`fs.promises.readFile` and `fs.promises.writeFile`) are fully stubbed. This prevents test collisions, keeps mock runs fast, and avoids disk writes in CI.

2. **External AI API Isolation:**
   - In `tests/ai.test.js`, the native `fetch` requests to `https://text.pollinations.ai/` are intercepted and mocked using Jest, simulating successful answers, recommendations, and 500 error API responses.

3. **Prevention of Open Socket Handles:**
   - Testing configuration checks (such as checking if the server exits on missing `JWT_SECRET`) uses `jest.isolateModules` and mocks `process.exit()` to throw a custom `Error`. This guarantees that execution halts immediately and Jest teardown completes cleanly without TCP port leaks.
