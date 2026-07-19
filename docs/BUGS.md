# 🐛 NEXUS ESPORTS — BUGS

## 🔴 CRITICAL (Breaks core functionality)
- [ ] Maintenance overlay sometimes persists after cancellation
- [ ] Admin bypass not working in some edge cases during maintenance
- [ ] Page refresh loop when maintenance triggers

---

## 🟡 HIGH (Affects user experience)
- [ ] Slow page loads on large datasets (community, fixtures, notifications)
- [ ] No loading states on some pages (users see blank screen)
- [ ] No empty states on some pages (users see empty white space)
- [ ] NaN appears in maintenance countdown on refresh
- [ ] Schedule shows "Calculating..." instead of actual time

---

## 🟢 LOW (Minor issues)
- [ ] Image optimization missing (large image sizes)
- [ ] No skeleton loading on all pages
- [ ] Missing error boundaries for API failures
- [ ] Some API calls return 401 incorrectly

---

## ✅ FIXED
- [x] NaN in maintenance countdown display
- [x] 401 on public maintenance API endpoint
- [x] Footer links pointing to non-existent pages
- [x] Empty JSON body causing "Unexpected end of JSON input"
- [x] Maintenance banner not showing in production
- [x] Support email updated to nexusesportshub@gmail.com
- [x] Nested form causing hydration error
- [x] Scheduled maintenance not triggering

---

## 📊 Bug Tracking
- **Total Found:** 15
- **Fixed:** 8
- **In Progress:** 0
- **Pending:** 7