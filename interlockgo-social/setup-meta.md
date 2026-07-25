# Meta setup — get your Page access token (one-time, ~20 min)

This is the only part I can't do for you: it requires clicking inside Meta's dashboards while
logged into the Facebook account that manages your Interlock Go Page. Do it once and you're set.

> Why this way? This uses Meta's official Graph API. We are NOT automating a login or storing your
> password. A Page access token is the supported, ToS-safe way for an app to post to a Page you own.

## 1. Create a Meta developer app
1. Go to https://developers.facebook.com/ and log in with your Facebook account.
2. Top right → **My Apps** → **Create App**.
3. Name it `Interlock Go Social`, add your email.
4. On the "Add use cases" screen, choose **Create an app without a use case** → **Next**.
   (This is the modern replacement for the old "Other" option, which Meta is removing. It gives
   you a plain app ID with no preset permissions — we grant Page permissions later via the
   Graph API Explorer.)
5. Confirm / create the app.

## 2. Add the Graph API tool
1. In the app dashboard left sidebar, find **Graph API Explorer**
   (or go to https://developers.facebook.com/tools/explorer/).
2. In the Explorer, set **Meta App** = your new app.
3. Click **Generate Access Token** / **Get Token** → **Get Page Access Token**.
4. When prompted, select your **Interlock Go Page** and grant these permissions:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_show_list`
5. You now have a **short-lived** Page token in the box. Copy it.

## 3. Find your Page ID
- In the Graph API Explorer, with the token in place, query: `me/accounts`
  and click Submit. Find your Interlock Go Page in the results — its `id` is your **FB_PAGE_ID**.
- (Or visit your Page → About → scroll to **Page ID**.)

## 4. Convert to a long-lived token (so it doesn't expire in ~1 hour)
You need your **App ID** and **App Secret** (App dashboard → **Settings → Basic**).

Run this in Terminal, substituting your values:

```bash
curl -s "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=SHORT_LIVED_TOKEN"
```

That returns a long-lived **user** token (~60 days). Now exchange it for a **never-expiring Page
token** by querying `me/accounts` again with the long-lived user token:

```bash
curl -s "https://graph.facebook.com/v21.0/me/accounts?access_token=LONG_LIVED_USER_TOKEN"
```

The `access_token` shown next to your Page in that response is a **long-lived Page token** that
does not expire as long as you use it. That is the value you want.

## 5. Save your secrets
1. In this folder: `cp secrets.env.example secrets.env`
2. Open `secrets.env` and paste:
   - `FB_PAGE_ACCESS_TOKEN=` the long-lived Page token from step 4
   - `FB_PAGE_ID=` your Page ID from step 3
3. Save. `secrets.env` is gitignored — it never gets committed.

## 6. Test it
```bash
node -e "import('./publish.js').then(m=>m.publishText('Interlock Go test post ✅').then(id=>console.log('Posted:',id)))"
```
Check your Page — you should see the test post. Delete it from Facebook afterward if you like.

## Notes & gotchas
- **App Mode:** while your app is in *Development* mode, posting to a Page **you admin** works fine.
  You do NOT need App Review or to go Live just to post to your own Page.
- If a token ever stops working (you changed your password, revoked access, etc.), redo steps 2–5.
- Keep the token secret. Anyone with it can post as your Page.
