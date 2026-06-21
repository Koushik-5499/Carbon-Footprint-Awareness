# Security Policy

This document outlines the security policies, disclosure process, and built-in security controls for the EcoTrack Carbon Footprint Awareness platform.

## Supported Versions

Security updates and patches are provided for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it immediately by email to:
**security@ecotrack.org**

Please include the following details in your report:
- Type of issue (e.g., XSS, SQLi, Buffer overflow, RCE)
- Step-by-step instructions to reproduce the issue
- Potential impact and proof of concept (if available)

We will acknowledge receipt of your report within 48 hours and work with you to resolve the issue promptly. Do not disclose vulnerabilities publicly before a fix has been released.

## Security Architecture Overview

EcoTrack implements a comprehensive, defense-in-depth security architecture to ensure user data protection and API integrity:

### 1. Hardening & HTTP Headers
- **Helmet.js Integration:** Automatically sets secure HTTP response headers to harden the server.
- **Content Security Policy (CSP):** Restricts script, style, and media resource origins to verified CDNs (FontAwesome, Chart.js) and the local directory, mitigating Cross-Site Scripting (XSS) and data injection.
- **HTTP Parameter Pollution (HPP) Prevention:** Configured `hpp` middleware to block parameter pollution attacks.

### 2. Input Sanitization & Validation
- **Declarative Router Validation:** Utilizes `express-validator` on all API routes to enforce schema constraints (e.g. email checks, password length, and non-negative numbers for calculations) before routing requests.
- **Recursive XSS Sanitizer Middleware:** Recursively strips `<script>` tags, HTML entities, and potential XSS vectors from request bodies, parameters, and query strings.
- **Frontend HTML Escaping:** Uses a global `escapeHTML` helper to escape names, emails, and chat messages prior to rendering, neutralizing stored/reflected XSS threats in the DOM.

### 3. Authentication & Access Control
- **JWT Authorization:** Restricts protected routes via JSON Web Tokens with robust expiry.
- **Secure Password Hashing:** Uses `bcryptjs` with 12 salt rounds to hash user credentials.
- **Database Safety:** Strips the hashed password field from all profile responses before sending them over the network.

### 4. Rate Limiting & Abuse Prevention
- **Global Rate Limiting:** Limits each IP to 100 requests per 15 minutes.
- **Strict Authentication Limiting:** Restricts register and login routes to 15 attempts per 15 minutes to block brute-force attacks.

### 5. Error & Audit Logs
- **morgan Logging:** Maintained logs for security auditing.
- **Sanitized Errors:** Suppresses stack traces and raw error messages in production environments.
