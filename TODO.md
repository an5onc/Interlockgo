# InterlockGo Marketing Site TODO

> Marketing site for Interlockgo-NOCO (interlockgo.io)
> **Status:** Live on GitHub Pages + Cloudflare

## ✅ Completed
- [x] 5 SEO city landing pages (Fort Collins, Loveland, Greeley, Johnstown, Windsor)
- [x] Mobile nav menu fix (backdrop-filter issue)
- [x] Appointments page (card layout, handset images, provider badges)
- [x] `/review/` redirect route → Google review page
- [x] LocalBusiness JSON-LD on all pages
- [x] NAP consistent (Unit #7 address)
- [x] Twilio domain verification file

## ⚠️ Known Issues
- [ ] **Cybertruck 3D model broken** — Cloudflare CSP missing `blob:` in connect-src
  - Fix: Anson needs to add `blob:` to connect-src in Cloudflare dashboard

## 🔜 Nice to Have
- [ ] More city landing pages (Longmont, Boulder, etc.)
- [ ] Blog/resources section for SEO
- [ ] Online booking integration

## 📝 Notes
- **Live URL:** https://interlockgo.io
- **Hosting:** GitHub Pages + Cloudflare CDN/DNS
- **Address:** 3610 35th Ave Unit 7, Evans, CO 80620

## Tech Stack
- Static HTML/CSS/JS
- Three.js for 3D model
- GitHub Pages hosting
