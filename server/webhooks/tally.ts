/**
 * Tally.so Webhook Handler
 * Receives feedback submissions from Tally forms and saves to database
 */

import { Router } from "express";
import { getDb } from "../db";
import { feedback } from "../../drizzle/schema-postgres";

export const tallyWebhookRouter = Router();

/**
 * POST /api/webhooks/tally
 * Handles form submissions from Tally.so
 */
tallyWebhookRouter.post("/tally", async (req, res) => {
  try {
    console.log("📥 Tally webhook received:", JSON.stringify(req.body, null, 2));

    const { eventType, data } = req.body;

    // Verify it's a form response event
    if (eventType !== "FORM_RESPONSE") {
      console.log("⚠️ Ignoring non-form-response event:", eventType);
      return res.status(200).json({ success: true, message: "Event ignored" });
    }

    if (!data || !data.fields) {
      console.error("❌ Invalid webhook payload - missing data or fields");
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    // Extract field values into a simple object
    const fields = data.fields.reduce((acc: any, field: any) => {
      const label = field.label.toLowerCase().trim();
      acc[label] = field.value;
      return acc;
    }, {});

    console.log("📋 Extracted fields:", fields);

    // Map Tally category options to database enum values
    const categoryMap: { [key: string]: string } = {
      "🐛 bug report": "Bug",
      "bug report": "Bug",
      "💡 feature request": "Feature Request",
      "feature request": "Feature Request",
      "❤️ praise": "Praise",
      "praise": "Praise",
      "😕 complaint": "Complaint",
      "complaint": "Complaint",
      "💬 general feedback": "General",
      "general feedback": "General",
      "general": "General",
      "🔧 other": "Other",
      "other": "Other",
    };

    // Get category (try different field name variations)
    const rawCategory = fields.category || fields["what type of feedback is this?"] || "General";
    const category = categoryMap[rawCategory.toLowerCase()] || "General";

    // Parse rating (convert string to number, handle various formats)
    let rating: number | null = null;
    const ratingField = fields.rating || fields["rate your experience"] || fields["how would you rate your overall experience?"];
    if (ratingField) {
      const parsedRating = parseInt(String(ratingField).replace(/[^0-9]/g, ""));
      if (!isNaN(parsedRating) && parsedRating >= 1 && parsedRating <= 5) {
        rating = parsedRating;
      }
    }

    // Get title (try different field name variations)
    const title =
      fields.title ||
      fields["brief summary"] ||
      fields["brief summary of your feedback"] ||
      fields.summary ||
      "Feedback from Tally";

    // Get message/details (try different field name variations)
    const message =
      fields.details ||
      fields["please provide more details"] ||
      fields.message ||
      fields.description ||
      fields.feedback ||
      "";

    // Get email and name
    const userEmail =
      fields.email || fields["your email"] || fields["your email (optional)"] || null;
    const userName = fields.name || fields["your name"] || fields["your name (optional)"] || null;

    // Validate required fields
    if (!title || title.length < 3) {
      console.error("❌ Title is required and must be at least 3 characters");
      return res.status(400).json({ error: "Title is required" });
    }

    if (!message || message.length < 10) {
      console.error("❌ Message is required and must be at least 10 characters");
      return res.status(400).json({ error: "Message must be at least 10 characters" });
    }

    // Prepare metadata
    const metadata = JSON.stringify({
      source: "tally",
      tallyEventId: req.body.eventId,
      tallyFormId: data.formId,
      tallyFormName: data.formName,
      tallyRespondentId: data.respondentId,
      submittedAt: req.body.createdAt,
      rawFields: fields,
    });

    // Insert into database
    const db = await getDb();
    const result = await db
      .insert(feedback)
      .values({
        userId: null, // anonymous submission
        category: category as any,
        rating: rating,
        title: title.substring(0, 255), // Ensure max length
        message: message,
        userEmail: userEmail ? userEmail.substring(0, 320) : null,
        userName: userName ? userName.substring(0, 255) : null,
        source: "tally",
        status: "New",
        metadata: metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: feedback.id });

    const feedbackId = result[0]?.id;

    console.log(`✅ Feedback saved successfully! ID: ${feedbackId}`);
    console.log(`   Category: ${category}`);
    console.log(`   Rating: ${rating || "N/A"}`);
    console.log(`   Title: ${title}`);
    console.log(`   Email: ${userEmail || "anonymous"}`);

    // Send success response to Tally
    res.status(200).json({
      success: true,
      message: "Feedback received and saved",
      feedbackId: feedbackId,
    });
  } catch (error) {
    console.error("❌ Tally webhook error:", error);
    
    // Send error details in development, generic message in production
    const isDev = process.env.NODE_ENV !== "production";
    res.status(500).json({
      error: "Failed to process webhook",
      message: isDev && error instanceof Error ? error.message : "Internal server error",
      details: isDev ? error : undefined,
    });
  }
});

/**
 * GET /api/webhooks/tally/health
 * Health check endpoint for Tally webhook
 */
tallyWebhookRouter.get("/tally/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Tally webhook endpoint is ready",
    timestamp: new Date().toISOString(),
  });
});
