# Supabase setup

Run these scripts in the Supabase SQL Editor, in this order, on a new project.

| Order | Script | What it adds |
| --- | --- | --- |
| 1 | [`schema.sql`](schema.sql) | Profiles, models, wardrobe, try-ons, favorites, storage buckets |
| 2 | [`social-bootstrap.sql`](social-bootstrap.sql) | Friends, posts, likes, and the `updated_at` helper |
| 3 | [`chatbot-schema.sql`](chatbot-schema.sql) | Advisor conversations, travel searches, and saved outfits |
| 4 | [`fix-storage.sql`](fix-storage.sql) | Public read access for image buckets |
| 5 | [`fix-friends-rls.sql`](fix-friends-rls.sql) | Friend-request insert policy |
| 6 | [`fix-friend-search.sql`](fix-friend-search.sql) | Profile discovery for friend search |
| 7 | [`fix-feed-image-visibility.sql`](fix-feed-image-visibility.sql) | Shared try-on images on the community feed |
| 8 | [`fix-tagged-item-visibility.sql`](fix-tagged-item-visibility.sql) | Tagged wardrobe items on shared posts |

[`social-schema.sql`](social-schema.sql) is the original friends/posts draft. Prefer `social-bootstrap.sql` on a fresh database; it is idempotent and includes the trigger function the social tables need.

Auth: enable email sign-up in the Supabase dashboard. Storage buckets are created by `schema.sql`.
