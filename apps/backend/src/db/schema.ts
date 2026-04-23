import { pgTable, text, real, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

const id = () => text('id').primaryKey().default(sql`gen_random_uuid()`)
const tenantId = () => text('tenant_id').notNull()
const createdAt = () => timestamp('created_at').notNull().defaultNow()

export const videoStatusEnum = pgEnum('video_status', [
  'pending',
  'processing',
  'ready',
  'failed',
])

export const highlightStatusEnum = pgEnum('highlight_status', [
  'pending_review',
  'published',
  'deleted',
])

export const videos = pgTable('videos', {
  id: id(),
  tenantId: tenantId(),
  url: text('url').notNull(),
  title: text('title'),
  status: videoStatusEnum('status').notNull().default('pending'),
  introEnd: real('intro_end'),
  outroStart: real('outro_start'),
  introDetectionMethod: text('intro_detection_method'),
  createdAt: createdAt(),
})

export const transcripts = pgTable('transcripts', {
  id: id(),
  videoId: text('video_id').notNull(),
  tenantId: tenantId(),
  word: text('word').notNull(),
  startTime: real('start_time').notNull(),
  endTime: real('end_time').notNull(),
})

export const highlights = pgTable('highlights', {
  id: id(),
  videoId: text('video_id').notNull(),
  tenantId: tenantId(),
  label: text('label').notNull(),
  startTime: real('start_time').notNull(),
  endTime: real('end_time').notNull(),
  confidence: real('confidence').notNull(),
  status: highlightStatusEnum('status').notNull().default('pending_review'),
  createdAt: createdAt(),
})

export const summaries = pgTable('summaries', {
  id: id(),
  videoId: text('video_id').notNull(),
  tenantId: tenantId(),
  content: text('content').notNull(),
  createdAt: createdAt(),
})

export const apiKeys = pgTable('api_keys', {
  id: id(),
  tenantId: tenantId(),
  keyHash: text('key_hash').notNull().unique(),
  name: text('name'),
  createdAt: createdAt(),
})

export const events = pgTable('events', {
  id: id(),
  videoId: text('video_id').notNull(),
  tenantId: tenantId(),
  viewerId: text('viewer_id').notNull(),
  type: text('type').notNull(),
  payload: jsonb('payload'),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
})

export const watchProgress = pgTable('watch_progress', {
  id: id(),
  videoId: text('video_id').notNull(),
  tenantId: tenantId(),
  viewerId: text('viewer_id').notNull(),
  position: real('position').notNull().default(0),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
