# Samriddhi Gyan — Full Stack LMS & AI Learning Platform

Samriddhi Gyan is a comprehensive learning management and career development platform featuring real-time AI assistance, hybrid recommendation engines, course streaming via HLS, geolocation hub searches, and integrated multi-channel payments (Stripe, eSewa).

---

## ⚠️ CRITICAL SECURITY NOTICE & GIT HISTORY WARNING

> [!CAUTION]
> **ROTATE ALL PREVIOUSLY COMMITTED SECRETS IMMEDIATELY BEFORE PRODUCTION DEPLOYMENT**
>
> During the security pass, credentials and API keys that were previously embedded in code or configuration files were purged and migrated to strict environment variables.
>
> Because Git preserves commit snapshots, **any secret that was previously committed in Git history remains accessible in the repository repository history** until the repository is purged or the credentials are invalidated.

### 🔑 Mandatory Key Rotation Checklist
Before deploying to production, immediately regenerate and rotate the following credentials from their respective provider dashboards:
1. **Google Gemini AI API Key**: Invalidate old API keys in Google AI Studio / Google Cloud Console and generate a new key.
2. **Google Maps API Key**: Invalidate and regenerate key in Google Cloud Console. Set HTTP Referrer domain restrictions (e.g., `https://yourdomain.com/*`).
3. **Google OAuth 2.0 Credentials**: Regenerate `GOOGLE_CLIENT_SECRET` in Google Cloud Console > APIs & Services > Credentials.
4. **Stripe API Keys**: Roll and rotate `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Stripe Dashboard.
5. **Cloudinary Credentials**: Invalidate and reset `API_SECRET` in Cloudinary Console.
6. **Cloudflare R2 API Tokens**: Rotate `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` in Cloudflare Dashboard.
7. **eSewa Merchant Credentials**: Update merchant secret keys for live production.
8. **Email / SMTP App Passwords**: Revoke previous Google App Passwords and generate a fresh one for production transactional email.
9. **JWT & Session Secrets**: Generate new cryptographically secure 64-character random strings for `SECRET_KEY` and `SESSION_SECRET`.

### 🧹 Purging Secrets from Git History (Optional / Recommended for Public Repos)
To permanently purge old secrets from past Git commits before publishing to a public repository:
```bash
# Using git-filter-repo (Recommended)
pip install git-filter-repo
git filter-repo --replace-text <(echo "OLD_SECRET==>REDACTED")

# Or using BFG Repo-Cleaner
java -jar bfg.jar --replace-text passwords.txt
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

---

## 🛠️ Environment Configuration

Refer to the `.env.example` files in each service directory for setup:
- **Root Guide**: [`.env.example`](.env.example)
- **Client (React / Vite)**: [`client/.env.example`](client/.env.example)
- **Server (Node.js / Express)**: [`server/.env.example`](server/.env.example)
- **AI Recommendation Service (FastAPI)**: [`hybrid_recommendation_server/.env.example`](hybrid_recommendation_server/.env.example)

