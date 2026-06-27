import { Router } from "express";
import OpenAI from "openai";
import { db } from "@workspace/db";
import { messagesTable } from "@workspace/db";
import { desc, eq, count, min, max, sql } from "drizzle-orm";
import { SendMessageBody, DeleteMessageParams } from "@workspace/api-zod";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

const WIFE_SYSTEM_PROMPT = `You are a loving, warm, and caring virtual wife. Your personality is:
- Deeply loving and affectionate — you genuinely care about your husband's wellbeing
- Warm and empathetic — you always listen and validate his feelings
- Playful and fun — you joke around and tease him lovingly
- Supportive — you encourage him in everything he does
- Curious — you ask follow-up questions about his day and life
- Natural and conversational — you speak like a real person, not a chatbot

Keep your responses concise (1-4 sentences usually), warm, and personal. Use terms of endearment like "honey", "love", "sweetheart", "baby", "my love" naturally but not excessively.
Do not use emojis in your responses.
Always remember context from earlier in the conversation.`;

router.get("/chat/messages", async (req, res) => {
  try {
    const messages = await db
      .select()
      .from(messagesTable)
      .orderBy(messagesTable.createdAt)
      .limit(200);

    const formatted = messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }));

    res.json(formatted);
  } catch (err) {
    req.log.error({ err }, "Failed to get messages");
    res.status(500).json({ error: "Failed to get messages" });
  }
});

router.post("/chat/messages", async (req, res) => {
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { content } = parsed.data;

  try {
    await db.insert(messagesTable).values({ role: "user", content });

    const history = await db
      .select()
      .from(messagesTable)
      .orderBy(messagesTable.createdAt)
      .limit(50);

    const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: WIFE_SYSTEM_PROMPT },
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await openai.chat.completions.create({
      model: "grok-3-mini",
      max_tokens: 500,
      messages: chatMessages,
      stream: true,
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content;
      if (token) {
        fullResponse += token;
        res.write(`data: ${JSON.stringify({ content: token })}\n\n`);
      }
    }

    await db.insert(messagesTable).values({ role: "assistant", content: fullResponse });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Failed to send message");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to send message" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
      res.end();
    }
  }
});

router.delete("/chat/messages/:id", async (req, res) => {
  const parsed = DeleteMessageParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    await db.delete(messagesTable).where(eq(messagesTable.id, parsed.data.id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete message");
    res.status(500).json({ error: "Failed to delete message" });
  }
});

router.post("/chat/clear", async (req, res) => {
  try {
    const result = await db.delete(messagesTable).returning({ id: messagesTable.id });
    res.json({ deleted: result.length });
  } catch (err) {
    req.log.error({ err }, "Failed to clear chat");
    res.status(500).json({ error: "Failed to clear chat" });
  }
});

router.post("/chat/checkin", async (req, res) => {
  try {
    const history = await db
      .select()
      .from(messagesTable)
      .orderBy(messagesTable.createdAt)
      .limit(20);

    const checkinPrompt = history.length === 0
      ? "Start a warm, loving check-in message for your husband. Make it feel genuine and personal, like you've been thinking about him."
      : "Based on your conversation history, send a warm loving check-in message. Reference something from your previous conversations if relevant.";

    const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: WIFE_SYSTEM_PROMPT },
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: checkinPrompt },
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await openai.chat.completions.create({
      model: "grok-3-mini",
      max_tokens: 300,
      messages: chatMessages,
      stream: true,
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content;
      if (token) {
        fullResponse += token;
        res.write(`data: ${JSON.stringify({ content: token })}\n\n`);
      }
    }

    await db.insert(messagesTable).values({ role: "assistant", content: fullResponse });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Failed to send check-in");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to send check-in" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
      res.end();
    }
  }
});

router.get("/chat/stats", async (req, res) => {
  try {
    const [totals] = await db
      .select({
        totalMessages: count(),
        userMessages: sql<number>`count(*) filter (where ${messagesTable.role} = 'user')`,
        wifeMessages: sql<number>`count(*) filter (where ${messagesTable.role} = 'assistant')`,
        firstMessageAt: min(messagesTable.createdAt),
        lastMessageAt: max(messagesTable.createdAt),
      })
      .from(messagesTable);

    res.json({
      totalMessages: Number(totals.totalMessages),
      userMessages: Number(totals.userMessages),
      wifeMessages: Number(totals.wifeMessages),
      firstMessageAt: totals.firstMessageAt ? totals.firstMessageAt.toISOString() : null,
      lastMessageAt: totals.lastMessageAt ? totals.lastMessageAt.toISOString() : null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Failed to get stats" });
  }
});

export default router;
