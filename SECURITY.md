# Security Policy

## 🛡️ Commitment to Security

StreamIndian is a public open-source project. Protecting user data, maintaining API key confidentiality, and preventing secret exposure in public source code is our highest priority.

---

## 🔒 No Secrets Policy

This repository adheres to a strict **Zero Hardcoded Credentials Policy**.

### Mandatory Rules:
1. **No Embedded Keys**: API keys, tokens, OAuth secrets, session tokens, database URIs, or private certificates MUST NEVER be hardcoded in any code, configuration file, or script.
2. **Environment Variable Injections**: All credentials must be supplied via runtime environment variables (`process.env` / `import.meta.env`) or securely injected user configurations.
3. **Pre-Push Verification**: Every commit is audited prior to push. Attempts to commit `.env`, `.env.local`, `.pem`, `.key`, or real API credentials will be rejected immediately.

---

## 📋 Reporting a Vulnerability

If you discover a security vulnerability or credential leak within this repository, please notify the lead engineering maintainers immediately.

### How to Report:
- **Email**: Send a detailed security advisory to `security@streamindian.app` (or contact maintainers directly).
- **Do NOT**: Do not open public GitHub issues or discussions for security vulnerabilities or key disclosures.

### Please include:
1. Description of the vulnerability or exposed asset.
2. Location in codebase (file path, line number, commit hash).
3. Steps to reproduce or verify.
4. Potential security impact.

We endeavor to acknowledge all reports within 24 hours and issue necessary remediation or credential revocations promptly.

---

## 🎯 Supported Versions

Security updates and patches are actively applied to the following branches:

| Version | Supported |
| ------- | --------- |
| Main (Latest) | ✅ Supported |
| Development | ✅ Supported |
| Legacy Builds (< 1.0) | ❌ Unsupported |

---

## 🛠️ Security Best Practices for Developers

- Always verify `.gitignore` before staging or committing files.
- Keep dependency versions updated and execute `npm audit` regularly.
- Use placeholder values (e.g. `YOUR_TMDB_API_KEY`) in documentation and sample configs.
