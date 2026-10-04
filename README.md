# GCT Kamalia website (Node.js)

## Chalane ka tariqa
1. nodejs.org se Node.js LTS (version 20 ya naya) install karein.
2. Is folder ko VS Code mein kholein aur Terminal > New Terminal dabayein.
3. `npm install`
4. `.env` file kholein aur `ADMIN_EMAIL` mein apni email likhein.
5. `npm start`
6. Browser mein http://localhost:3000 kholein.
7. "Login" > "Create an account" mein usi email se account banayein. Ye account admin ban jata hai.

## Kya kya hai
- Accounts aur dashboard: students apne reviews aur inquiries dekhte hain, admin sab inquiries aur reviews ki approval dekhta hai.
- Database: `data.db` (SQLite) file, khud ban jati hai. Is ka backup rakhein.
- Server logic: input ki check, rate limit, password hashing, reviews ki approval.
- Admission form ka data ab database mein jata hai.

## Internet par live karna (SSL aur CDN)
- SSL: Render, Railway, Fly.io jaisi hosting par HTTPS khud lag jata hai. Apne VPS par Certbot (Let's Encrypt) se certificate lein aur `.env` mein `SSL_KEY_FILE`, `SSL_CERT_FILE` likhein.
- Live server par `.env` mein `NODE_ENV=production` likhein aur naya lamba `JWT_SECRET` banayein (is zip wala secret istemal na karein).
- CDN: domain Cloudflare par daalein (free plan). Server ke caching headers pehle se lage hain.
- `public/robots.txt` aur `public/sitemap.xml` mein `YOUR-DOMAIN` ko asli domain se badlein.
