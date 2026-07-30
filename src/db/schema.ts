import {
  pgTable,
  serial,
  text,
  timestamp,
  date,
  integer,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";

export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  mealType: varchar("meal_type", { length: 50 }).notNull(),
  foodName: text("food_name").notNull(),
  calories: integer("calories"),
  notes: text("notes"),
  time: varchar("time", { length: 10 }),
  image: text("image"), // base64 image
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes"),
  startTime: varchar("start_time", { length: 10 }),
  endTime: varchar("end_time", { length: 10 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dailyStatus = pgTable("daily_status", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  sleepHours: integer("sleep_hours"),
  waterCups: integer("water_cups"),
  weight: integer("weight"),
  dailyNote: text("daily_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 10 }).default("VND"),
  image: text("image"), // receipt image base64
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const liveTracking = pgTable("live_tracking", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  isActive: boolean("is_active").default(true).notNull(),
  notes: text("notes"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  locationName: text("location_name"),
});

// Offline pending entries - stored locally but synced when online
export const pendingSync = pgTable("pending_sync", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 20 }).notNull(), // meal, expense, activity
  data: text("data").notNull(), // JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
