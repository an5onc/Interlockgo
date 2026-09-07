<claude-mem-context>
# Memory Context

# [Interlockgo] recent context, 2026-05-26 8:42am MDT

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 33 obs (9,106t read) | 126,489t work | 93% savings

### May 16, 2026
S27 Identify forms on website and evaluate attack surface for bot protection (May 16 at 10:24 AM)
183 10:53a 🔵 Forms found in Interlockgo codebase
184 " 🔵 Appointment callback form structure identified
185 " 🔵 Form submission endpoint identified
S28 Delete appointments page after user stated it's hidden and undiscovered unless URL is typed directly (May 16 at 10:53 AM)
186 11:14a 🔵 Appointments page has 23 external references across codebase
187 " 🔵 Appointments page is core conversion point with 18+ active button links
S29 Neutralize bot attacks on InterlockGo appointments page after receiving Cloudflare warning email (May 16 at 11:14 AM)
188 11:33a 🔵 Phone numbers identified across site HTML files
189 11:34a 🔵 Contact page phone number roles identified
190 " 🔵 After-hours callback form structure identified
191 11:51a ✅ After-Hours Contact Refactored to Remove Form Bot Attack Vector
192 11:52a 🔵 Missing CSS for New appt-cta-row Container
193 " ✅ Added CSS Styling for New appt-cta-row Button Container
S30 Address bot traffic issue reported by Cloudflare; neutralize callback-based bot exploitation vector on website (May 16 at 11:52 AM)
194 11:53a 🔵 Bot Neutralization is Part of Larger Mobile Optimization Branch
S31 Neutralize bot traffic targeting callback-request endpoint after Cloudflare alert; determine if backend cleanup required (May 16 at 11:54 AM)
195 11:55a 🔵 Callback-request route not found in interlockgo-admin backend repository
196 " 🔵 Callback-request endpoint pattern completely absent from interlockgo-admin codebase
197 " 🔵 Interlockgo-admin API routes inventory: callback-request endpoint definitively absent
S32 Determine how many customer callback requests were silently dropped during the 70-day period when the form was live but backend endpoint didn't exist (May 16 at 11:56 AM)
198 11:57a 🔵 Callback form timeline: introduced March 7, 2026; removed May 16, 2026
199 " 🔵 Site has analytics libraries configured; potentially logged callback form submission attempts
200 " 🔵 Appointments page has Google Ads conversion tracking; form submissions should be logged
S33 Neutralize bot traffic exploiting callback-request endpoint; verify backend cleanup needed; investigate customer data loss from silently failing form submissions (May 16 at 11:58 AM)
S34 Fix oversized partner/sponsor logos display on city pages with responsive CSS sizing (May 16 at 11:58 AM)
201 11:58a 🔵 Partner logo guardianV2.png vastly oversized: 1.8MB, 4250x3284 pixels
202 12:00p 🔵 Logo image CSS classes have no sizing constraints: .logos__label, .logos__row, .logos__img absent from theme.css
### May 17, 2026
205 9:06p 🟣 Add logos section CSS styling to theme.css
S35 Merge feature branches (codex/mobile-optimization, bob/nightly-cleanup, bob/nightly-feature) into main (May 17 at 9:07 PM)
### May 18, 2026
211 8:13a 🔵 Merge conflict detected in index.html during branch integration
212 8:15a 🔵 Merge conflict reveals major structural divergence in index.html
213 " 🔵 bob/nightly-feature branched from earlier commit; main has diverged since merge base
214 8:16a ✅ Merge of bob/nightly-feature aborted due to structural conflict
215 " ✅ Mobile optimization and nightly cleanup branches deployed to main on GitHub
216 3:14p 🔵 GitHub Pages deployment configured with custom domain
217 " 🔵 Repository uses static GitHub Pages without Jekyll preprocessing
218 " 🔵 GitHub Actions workflows directory exists but contains no workflow files
219 " 🔵 Email address interlockgo@gmail.com is publicly published on website
220 " ✅ Created .well-known directory for web standards configuration
221 3:15p 🟣 Added security.txt vulnerability disclosure policy
222 " ✅ Created .nojekyll to explicitly disable Jekyll processing
S36 Add security.txt to address Cloudflare security insight about missing RFC 9116 vulnerability disclosure policy (May 18 at 3:15 PM)
**Investigated**: Examined deployment configuration (GitHub Pages with custom domain interlockgo.io), confirmed no Jekyll build process in use, checked for existing GitHub Actions workflows (found empty .github/workflows directory), identified published contact email (interlockgo@gmail.com) already on site across contact, homepage, and privacy policy pages

**Learned**: Repository uses pure static GitHub Pages hosting with custom domain via CNAME; no Jekyll preprocessing pipeline; standard .well-known directory was missing, which is why Cloudflare flagged the absent security.txt; Jekyll would normally strip dotfile directories from build output, requiring explicit .nojekyll file to ensure static assets in .well-known/ are served correctly

**Completed**: Created .well-known directory structure; created .well-known/security.txt file with RFC 9116 compliance (Contact: interlockgo@gmail.com, Expires: 2027-05-17, Canonical URL, Preferred-Languages: en); created .nojekyll empty file to disable Jekyll processing and ensure all static files including dotfiles are served directly by GitHub Pages

**Next Steps**: Ready to commit both files (.well-known/security.txt and .nojekyll) to repository and deploy to production; verify deployment by testing curl https://interlockgo.io/.well-known/security.txt; monitor Cloudflare dashboard for security insight to clear after next scan (typically within 1-2 days)


Access 126k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>