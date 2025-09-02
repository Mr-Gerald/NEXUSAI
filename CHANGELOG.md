# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-05-22

### Added
- `SYSTEM_REVIEW.md` file providing a comprehensive overview of the full-stack architecture.
- `CHANGELOG.md` to track project updates and versions.

### Fixed
- **CRITICAL**: Removed the incorrect `<script type="importmap">` from `index.html`. This was the root cause of the application failing to start, as it was attempting to load backend Node.js modules (like `express`, `ws`, `dotenv`) directly into the browser. The project's dependencies are now correctly and exclusively handled by Vite and the `package.json` configurations for the frontend and backend, respectively.
