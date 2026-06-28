import { Router } from "express";
import { db } from "@workspace/db";
import { messagesTable, memoryTable } from "@workspace/db";
import { desc, eq, count, min, max, sql } from "drizzle-orm";
import { SendMessageBody, DeleteMessageParams } from "@workspace/api-zod";
import { buildReply, ConvoMem } from "./engine";

const router = Router();

// ─── Memory helpers ───────────────────────────────────────────────────────────

async function loadMem(): Promise<ConvoMem> {
  const rows = await db.select().from(memoryTable);
  const m = new Map(rows.map((r) => [r.key, r.value]));
  return {
    userName:     m.get("user_name"),
    userJob:      m.get("user_job"),
    userBirthday: m.get("user_birthday"),
    anniversary:  m.get("anniversary"),
    userLocation: m.get("user_location"),
    userLikes:    m.get("user_likes"),
    favFood:      m.get("user_fav_food"),
    howWeMet:     m.get("how_we_met"),
    lastMood:     m.get("last_mood"),
  };
}

async function saveFact(key: string, value: string) {
  await db
    .insert(memoryTable)
    .values({ key, value })
    .onConflictDoUpdate({ target: memoryTable.key, set: { value, updatedAt: new Date() } });
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); }

async function extractMemory(userMsg: string, mem: ConvoMem) {
  const m = userMsg.toLowerCase();

  // Name
  const nameMatch = userMsg.match(/(?:my name is|call me|i'?m)\s+([A-Za-z]{2,20})\b/i);
  if (nameMatch) {
    const bad = ["fine","good","okay","great","well","sad","tired","busy","here","back","not","so","just","now"];
    const n = nameMatch[1].toLowerCase();
    if (!bad.includes(n) && !mem.userName) {
      await saveFact("user_name", cap(nameMatch[1]));
      mem.userName = cap(nameMatch[1]);
    }
  }
  // Job
  const jobMatch = userMsg.match(/(?:i(?:'m| am) a[n]?\s+|i work as a[n]?\s+|my (?:job|career) is\s+)([a-z\s]{3,35})(?:\.|,|\s|$)/i);
  if (jobMatch) { const j = jobMatch[1].trim(); if (j.length > 2) { await saveFact("user_job", j); mem.userJob = j; } }
  // Anniversary
  const annMatch = userMsg.match(/(?:our anniversary is|we got married on)\s+([a-z0-9\s,]+?)(?:\.|$)/i);
  if (annMatch) { await saveFact("anniversary", annMatch[1].trim()); mem.anniversary = annMatch[1].trim(); }
  // Birthday
  const bdMatch = userMsg.match(/(?:my birthday is|born on)\s+([a-z0-9\s,]+?)(?:\.|$)/i);
  if (bdMatch) { await saveFact("user_birthday", bdMatch[1].trim()); mem.userBirthday = bdMatch[1].trim(); }
  // Location
  const locMatch = userMsg.match(/(?:i(?:'m| am) from|i live in|we live in)\s+([A-Za-z\s]{2,30})(?:\.|,|$)/i);
  if (locMatch) { await saveFact("user_location", locMatch[1].trim()); mem.userLocation = locMatch[1].trim(); }
  // Likes
  const likeMatch = m.match(/i (?:love|really like|enjoy|adore)\s+(.{3,25})(?:\.|,|$)/);
  if (likeMatch) {
    const thing = likeMatch[1].replace(/[.,!?].*/, "").trim();
    const skipWords = ["you","her","this","it","that","us","our","my","your"];
    if (thing && !skipWords.some(w => thing.startsWith(w))) {
      const existing = mem.userLikes ?? "";
      if (!existing.includes(thing)) {
        const updated = existing ? `${existing}, ${thing}` : thing;
        await saveFact("user_likes", updated); mem.userLikes = updated;
      }
    }
  }
  // Fav food
  const foodMatch = userMsg.match(/(?:my (?:favorite|favourite) food is|i love eating)\s+([a-z\s]{2,20})(?:\.|,|$)/i);
  if (foodMatch) { await saveFact("user_fav_food", foodMatch[1].trim()); mem.favFood = foodMatch[1].trim(); }
  // How we met
  const metMatch = userMsg.match(/(?:we met|i met you)\s+(.{5,60})(?:\.|$)/i);
  if (metMatch && !mem.howWeMet) { await saveFact("how_we_met", metMatch[1].trim()); mem.howWeMet = metMatch[1].trim(); }
  // Mood
  if (/happy|great|amazing|excited|on top/.test(m)) { await saveFact("last_mood", "happy"); mem.lastMood = "happy"; }
  else if (/sad|depressed|crying|upset|heartbroken/.test(m)) { await saveFact("last_mood", "sad"); mem.lastMood = "sad"; }
  else if (/stress|anxious|overwhelmed|tired|exhausted/.test(m)) { await saveFact("last_mood", "stressed"); mem.lastMood = "stressed"; }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get("/chat/messages", async (req, res) => {
  try {
    const rows = await db.select().from(messagesTable).orderBy(messagesTable.createdAt).limit(200);
    res.json(rows.map((m) => ({ id: m.id, role: m.role, content: m.content, createdAt: m.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "get messages failed");
    res.status(500).json({ error: "Failed to get messages" });
  }
});

router.post("/chat/messages", async (req, res) => {
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const { content } = parsed.data;

  try {
    const [history, mem] = await Promise.all([
      db.select().from(messagesTable).orderBy(messagesTable.createdAt).limit(50),
      loadMem(),
    ]);

    await db.insert(messagesTable).values({ role: "user", content });
    await extractMemory(content, mem);

    const histCtx = history.map((m) => ({ role: m.role, content: m.content }));
    const reply = buildReply(content, histCtx, mem);
    await db.insert(messagesTable).values({ role: "assistant", content: reply });

    const recent = await db.select().from(messagesTable).orderBy(desc(messagesTable.createdAt)).limit(2);
    const aMsg = recent.find((m) => m.role === "assistant");
    const uMsg = recent.find((m) => m.role === "user");

    res.json({
      userMessage: { id: uMsg?.id ?? Date.now(), role: "user", content, createdAt: uMsg?.createdAt.toISOString() ?? new Date().toISOString() },
      assistantMessage: { id: aMsg?.id ?? Date.now() + 1, role: "assistant", content: reply, createdAt: aMsg?.createdAt.toISOString() ?? new Date().toISOString() },
    });
  } catch (err) {
    req.log.error({ err }, "send message failed");
    res.status(500).json({ error: "Failed to send message" });
  }
});

router.delete("/chat/messages/:id", async (req, res) => {
  const parsed = DeleteMessageParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await db.delete(messagesTable).where(eq(messagesTable.id, parsed.data.id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "delete message failed");
    res.status(500).json({ error: "Failed to delete message" });
  }
});

router.post("/chat/clear", async (req, res) => {
  try {
    const result = await db.delete(messagesTable).returning({ id: messagesTable.id });
    res.json({ deleted: result.length });
  } catch (err) {
    req.log.error({ err }, "clear chat failed");
    res.status(500).json({ error: "Failed to clear chat" });
  }
});

router.post("/chat/checkin", async (req, res) => {
  try {
    const [history, mem] = await Promise.all([
      db.select().from(messagesTable).orderBy(messagesTable.createdAt).limit(10),
      loadMem(),
    ]);

    const him = mem.userName ?? "love";
    const mood = mem.lastMood ?? "neutral";

    let prompt: string;
    if (history.length === 0) prompt = "hi";
    else if (mood === "sad" || mood === "stressed") prompt = "checking on you";
    else prompt = "daily checkin";

    const greeting = history.length === 0
      ? `Hey ${him}! Just stopping by to remind you that you are so loved. How's your day going? 💕`
      : mood === "sad" || mood === "stressed"
        ? buildReply("checking in on you", [], mem)
        : buildReply("hi", history.slice(-4).map(m => ({ role: m.role, content: m.content })), mem);

    const reply = greeting;
    await db.insert(messagesTable).values({ role: "assistant", content: reply });
    res.json({ content: reply, createdAt: new Date().toISOString() });
  } catch (err) {
    req.log.error({ err }, "checkin failed");
    res.status(500).json({ error: "Failed to send check-in" });
  }
});

router.get("/chat/stats", async (req, res) => {
  try {
    const [totals] = await db.select({
      totalMessages: count(),
      userMessages: sql<number>`count(*) filter (where ${messagesTable.role} = 'user')`,
      wifeMessages: sql<number>`count(*) filter (where ${messagesTable.role} = 'assistant')`,
      firstMessageAt: min(messagesTable.createdAt),
      lastMessageAt: max(messagesTable.createdAt),
    }).from(messagesTable);
    const mem = await loadMem();
    res.json({
      totalMessages: Number(totals.totalMessages),
      userMessages: Number(totals.userMessages),
      wifeMessages: Number(totals.wifeMessages),
      firstMessageAt: totals.firstMessageAt?.toISOString() ?? null,
      lastMessageAt: totals.lastMessageAt?.toISOString() ?? null,
      userName: mem.userName ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "stats failed");
    res.status(500).json({ error: "Failed to get stats" });
  }
});

router.get("/chat/memory", async (req, res) => {
  try {
    const rows = await db.select().from(memoryTable).orderBy(memoryTable.updatedAt);
    res.json(rows.map((r) => ({ key: r.key, value: r.value, updatedAt: r.updatedAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "memory failed");
    res.status(500).json({ error: "Failed to get memory" });
  }
});

export default router;
