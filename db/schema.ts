import { sqliteTable, text, integer, primaryKey, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const siteContent = sqliteTable('site_content', {
  id: text('id').primaryKey(),
  draftContent: text('draft_content').notNull(),
  publishedContent: text('published_content'),
  revision: integer('revision').notNull().default(1),
  updatedAt: text('updated_at').notNull(),
  publishedAt: text('published_at'),
});
export const galleryLikes = sqliteTable('gallery_likes', {
 photoId: text('photo_id').notNull(),
 visitorId: text('visitor_id').notNull(),
}, table=>[primaryKey({columns:[table.photoId,table.visitorId]})]);
export const timelineReactions = sqliteTable('timeline_reactions', {itemId:text('item_id').notNull(),visitorId:text('visitor_id').notNull()},t=>[primaryKey({columns:[t.itemId,t.visitorId]})]);
export const signups=sqliteTable('signups',{
 id:text('id').primaryKey(),eventId:text('event_id').notNull(),eventTitle:text('event_title').notNull(),participantName:text('participant_name').notNull(),email:text('email').notNull(),emailOptIn:integer('email_opt_in').notNull().default(0),createdAt:text('created_at').notNull(),privacyVersion:text('privacy_version').notNull(),
},t=>[uniqueIndex('signups_event_email_name').on(t.eventId,t.email,t.participantName)]);
export const signupLimits=sqliteTable('signup_limits',{id:text('id').primaryKey(),attempts:integer('attempts').notNull(),createdAt:text('created_at').notNull()});

export const uploadedPhotos=sqliteTable('uploaded_photos',{key:text('key').primaryKey(),bytes:integer('bytes').notNull(),etag:text('etag').notNull(),createdAt:text('created_at').notNull()});

export const formCounts=sqliteTable('form_counts',{id:text('id').primaryKey(),formUrl:text('form_url').notNull(),responseCount:integer('response_count').notNull(),accepting:integer('accepting').notNull(),observedAt:integer('observed_at').notNull()});
