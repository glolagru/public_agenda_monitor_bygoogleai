# Endpoint verification — round 1

**Accessed:** 2026-09-13

## Findings

1. **Federal President appointment feed:** `https://www.bundespraesident.de/SiteGlobals/Functions/RSSFeed/DE/RSSNewsfeed/Termine/RSSNewsfeed.xml?nn=127360`.
   - The official Federal President RSS page labels this exact link “RSS-Feed der Termine des Bundespräsidenten” and states that each feed has its own address for a feed reader.
   - **Source:** [Federal President — RSS-Nachrichten](https://www.bundespraesident.de/DE/service/rss-feeds/rss-feeds_node.html)
   - **Confidence:** high. The endpoint is linked by its publisher from its own official RSS directory.

2. **UN Women News feed:** `https://www.unwomen.org/en/feeds/news`.
   - UN Women’s official Web feeds page labels this endpoint “Latest news”; the adjacent `rss-feeds/news` link is the feed information page, not the feed URL.
   - **Source:** [UN Women — Web feeds](https://www.unwomen.org/en/rss-feeds)
   - **Confidence:** high. The endpoint is linked by its publisher from its own official feed directory.

3. **UN Women Publications feed:** `https://www.unwomen.org/en/feeds/publications`.
   - UN Women’s official Web feeds page labels this endpoint “Publications”; the adjacent `rss-feeds/publications` link is the feed information page, not the feed URL.
   - **Source:** [UN Women — Web feeds](https://www.unwomen.org/en/rss-feeds)
   - **Confidence:** high. The endpoint is linked by its publisher from its own official feed directory.

## Verification notes

- The browser’s direct navigation to the Federal President XML endpoint was blocked by a client-side blocker. This does not contradict the official source page, which exposes the endpoint explicitly; production code must still test HTTP status and parseability at runtime.
- No claim is made that the feeds currently contain qualifying events; the research establishes canonical fallback endpoints only.
