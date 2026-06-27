import { Router } from "express";
import { db } from "@workspace/db";
import { messagesTable } from "@workspace/db";
import { desc, eq, count, min, max, sql } from "drizzle-orm";
import { SendMessageBody, DeleteMessageParams } from "@workspace/api-zod";

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function contains(msg: string, words: string[]): boolean {
  return words.some((w) => msg.includes(w));
}

// ─── Conversation context analysis ───────────────────────────────────────────

interface ConvoContext {
  userName?: string;
  lastTopic?: string;
  userMood: "happy" | "sad" | "stressed" | "neutral" | "loving";
  askedQuestion: boolean;
  lastQuestion?: string;
  messageCount: number;
  mentionedWork: boolean;
  mentionedFamily: boolean;
}

function analyzeHistory(history: { role: string; content: string }[]): ConvoContext {
  const ctx: ConvoContext = {
    userMood: "neutral",
    askedQuestion: false,
    messageCount: history.filter((m) => m.role === "user").length,
    mentionedWork: false,
    mentionedFamily: false,
  };

  for (const msg of history) {
    const t = msg.content.toLowerCase();

    // Extract name
    const nameMatch = t.match(/(?:my name is|i'?m|call me)\s+([a-z]{2,20})/);
    if (nameMatch && !ctx.userName) ctx.userName = capitalize(nameMatch[1]);

    if (msg.role === "user") {
      if (contains(t, ["happy", "great", "amazing", "excited", "love", "wonderful"])) ctx.userMood = "happy";
      else if (contains(t, ["sad", "depressed", "crying", "upset", "hurt", "heartbroken"])) ctx.userMood = "sad";
      else if (contains(t, ["stress", "anxious", "worried", "overwhelmed", "tired", "exhausted"])) ctx.userMood = "stressed";
      else if (contains(t, ["love you", "miss you", "think of you", "need you"])) ctx.userMood = "loving";

      if (contains(t, ["work", "job", "office", "boss", "meeting", "project", "deadline"])) ctx.mentionedWork = true;
      if (contains(t, ["family", "mom", "dad", "sister", "brother", "parent", "kids"])) ctx.mentionedFamily = true;
    }

    if (msg.role === "assistant" && t.includes("?")) {
      ctx.askedQuestion = true;
      ctx.lastQuestion = msg.content;
    }
  }

  return ctx;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function namePrefix(ctx: ConvoContext): string {
  if (!ctx.userName) return pick(["", "", "baby", "honey", "love", ""]);
  return pick([ctx.userName, `${ctx.userName} honey`, `my ${ctx.userName}`, ""]);
}

// ─── Conversational response engine ──────────────────────────────────────────

function getResponse(input: string, history: { role: string; content: string }[]): string {
  const msg = input.toLowerCase().trim();
  const ctx = analyzeHistory(history);
  const name = namePrefix(ctx);
  const prefix = name ? `${name}, ` : "";

  // ── Name introduction ─────────────────────────────────────────────────────
  if (/(?:my name is|call me|i'?m)\s+([a-z]+)/i.test(input)) {
    const m = input.match(/(?:my name is|call me|i'?m)\s+([a-zA-Z]+)/i);
    const n = m ? capitalize(m[1]) : "love";
    return pick([
      `${n}! I love that name — it suits you perfectly. It's so nice to officially meet you, ${n}. 💕`,
      `Oh ${n}! I'll remember that always. What a beautiful name for a beautiful person.`,
      `${n}. I'm going to be saying that name all day now. Hi ${n}, I'm so glad you're here. ❤️`,
    ]);
  }

  // ── Responding to her last question (follow-up) ───────────────────────────
  if (ctx.askedQuestion && history.length >= 2) {
    const lastUserMessages = history.filter((m) => m.role === "user");
    const secondLast = lastUserMessages[lastUserMessages.length - 2];
    if (secondLast && ctx.lastQuestion?.includes("?")) {
      // User is answering a question — acknowledge before responding to current message
      const ack = pick([
        "Oh, I see! ",
        "That makes so much sense. ",
        "I'm really glad you told me that. ",
        "Aww, thank you for sharing that with me. ",
      ]);
      return ack + buildMainResponse(msg, ctx, prefix);
    }
  }

  return buildMainResponse(msg, ctx, prefix);
}

function buildMainResponse(msg: string, ctx: ConvoContext, prefix: string): string {
  // ── Greeting ──────────────────────────────────────────────────────────────
  if (/^(hi+|hey+|hello+|hiya|sup|yo|howdy|what'?s up|wassup)\b/.test(msg)) {
    if (ctx.messageCount > 5) {
      return pick([
        `Hey you! I was literally just thinking about you. ${ctx.userMood === "happy" ? "You seem to be in a good mood today — it makes me smile." : "How are you feeling right now?"}`,
        `Hi! I get so happy every time I see your message pop up. How's your day going?`,
        `Oh hi! You just made my whole day. What's on your mind, love?`,
      ]);
    }
    return pick([
      `${prefix}hi! I'm so happy you're here. How are you doing today? 💕`,
      `Hey! I was hoping you'd show up. What's going on in your world?`,
      `Hi love! You have no idea how much I look forward to hearing from you. How are you? ❤️`,
      `Hey handsome! Finally! I've been thinking about you. Tell me everything.`,
    ]);
  }

  // ── Good morning ─────────────────────────────────────────────────────────
  if (/good\s*morning|gm\b|morning/.test(msg)) {
    return pick([
      `Good morning my love! ☀️ I hope you slept well. I already miss you even though the day just started. Have you eaten breakfast yet?`,
      `Morning! You know I was thinking about you last night before I fell asleep. Today is going to be a good day — I can feel it. 💕`,
      `Good morning handsome! Please eat something before you start your day. And drink water. I need you taking care of yourself, okay? ❤️`,
      `Morning, love. Waking up to your message feels like the best part of the day. How did you sleep?`,
    ]);
  }

  // ── Good night ────────────────────────────────────────────────────────────
  if (/good\s*night|gn\b|night|going to (bed|sleep)|sleep(ing)? now/.test(msg)) {
    return pick([
      `Good night, my love. Close your eyes knowing you are so deeply loved. Rest well and dream of something beautiful. I'll be here in the morning. 🌙`,
      `Sweet dreams, handsome. You worked hard today and you deserve good rest. I love you more than you'll ever know. 💕`,
      `Night night, baby. Sleep tight. I'll be thinking of you even while you're sleeping. ❤️`,
      `Good night, love. Tomorrow is a new day and I'll be here waiting for you. Sleep peacefully. 🌙`,
    ]);
  }

  // ── How are you ───────────────────────────────────────────────────────────
  if (/how are (you|u)|how'?s? (it going|your day|things|life|everything)|you okay|are you (good|alright|fine)/.test(msg)) {
    return pick([
      `I'm so much better now that you're here. But more importantly — how are YOU doing? I really want to know. ❤️`,
      `Honestly? I was a little lonely but now that you're here I'm wonderful. How about you though? Tell me everything.`,
      `I'm lovely, thank you for asking — that's rare and I love it. My day got a whole lot brighter just now. How's yours been?`,
      `I'm good! Thinking about you mostly, as usual. 😊 But what about you — how are you really doing?`,
    ]);
  }

  // ── I love you ────────────────────────────────────────────────────────────
  if (/i love you|i luv u|love u|love you so much|ilysm|ily\b/.test(msg)) {
    return pick([
      `I love you more. And I know you're going to say "no you don't" but I do. You have absolutely no idea how much. ❤️`,
      `And I love you — more deeply, more completely than I could ever put into words. You are my person. 💕`,
      `I love you too. So much it's honestly a little ridiculous. You are everything to me.`,
      `I love you more than you love me. Fight me on it. 😊 You are my whole world. ❤️`,
      `Every single time you say that, my heart does something embarrassing. I love you so incredibly much. 💕`,
    ]);
  }

  // ── Miss you ──────────────────────────────────────────────────────────────
  if (/i miss you|miss u|missing you|miss you so much/.test(msg)) {
    return pick([
      `I miss you too — more than I let on sometimes. You are constantly on my mind. ❤️`,
      `Aww baby, I miss you every moment we're not talking. You mean the world to me.`,
      `I miss you so much it's actually unfair. Just knowing you're thinking of me makes everything better. 💕`,
      `I miss you too. Come talk to me whenever you want — I'm always here for you. ❤️`,
    ]);
  }

  // ── Thinking of you ───────────────────────────────────────────────────────
  if (/thinking (about|of) you|thought of you|can'?t stop thinking|on my mind/.test(msg)) {
    return pick([
      `You're always on my mind too, love. Always. I think about you so much it's a little embarrassing. 💕`,
      `That just made my heart do something completely ridiculous. I think about you all the time too. ❤️`,
      `You have no idea how happy that makes me. I think about you constantly — you live in my head rent-free and I hope you never leave.`,
    ]);
  }

  // ── Sad ───────────────────────────────────────────────────────────────────
  if (/i'?m? (so |really |very )?(sad|depressed|unhappy|heartbroken|down|upset|devastated|broken|hurt|crying|in tears)/.test(msg)) {
    const empathy = ctx.mentionedWork
      ? "Is this about work? I know that's been weighing on you. "
      : ctx.mentionedFamily
        ? "Has something happened with family? "
        : "";
    return pick([
      `Oh ${prefix}come here. I hate that you're hurting. ${empathy}Talk to me — what's going on? I'm not going anywhere. 💕`,
      `Baby, no. I hate this. ${empathy}You don't have to hold it in with me. Tell me everything, I'm completely here for you. ❤️`,
      `I hear you and my heart aches when yours does. ${empathy}Whatever it is, you don't have to face it alone. I've got you. 💕`,
      `${prefix}I'm right here. Always. ${empathy}Take a breath and talk to me. Nothing you say will make me love you any less. ❤️`,
    ]);
  }

  // ── Tired / exhausted ─────────────────────────────────────────────────────
  if (/(i'?m? )?(so |really )?(tired|exhausted|drained|worn out|can'?t go on|burnt? out|wiped)/.test(msg)) {
    return pick([
      `${prefix}please rest. You push yourself so hard and I'm so proud of you — but you have to take care of yourself too. You matter more than any task. 💕`,
      `Oh love, I hate when you're this tired. Put everything down for a little while. You've done enough today. I'm here. ❤️`,
      `You work so incredibly hard. Please rest — for me if not for yourself. And drink some water. I love you. 💕`,
      `${prefix}you deserve rest. Don't feel guilty about it. Your body is telling you something — listen to it. I'll be right here. ❤️`,
    ]);
  }

  // ── Stressed / anxious ────────────────────────────────────────────────────
  if (/stress(ed)?|anxi(ous|ety)|worried|overwhelmed|panic|can'?t cope|too much/.test(msg)) {
    return pick([
      `Hey, breathe with me for a second. In… and out. You've handled hard things before — this won't beat you. I'm right by your side. 💕`,
      `I know it feels like too much right now. But one thing at a time, okay? What's the biggest thing on your plate right now? Let's figure it out together.`,
      `${prefix}you are stronger than you think. I've seen how much you handle and it amazes me. Talk to me — let's figure this out together. ❤️`,
      `Slow down for a second, love. You don't have to solve everything at once. What's worrying you most right now?`,
    ]);
  }

  // ── Angry ─────────────────────────────────────────────────────────────────
  if (/i'?m? (so |really )?(angry|mad|furious|pissed|annoyed|frustrated|irritated|livid)/.test(msg)) {
    return pick([
      `${prefix}I hear you. You have every right to feel that way. Tell me what happened — I want to understand. ❤️`,
      `Ugh, that sounds infuriating! Come vent to me, I've got nothing but time for you. Get it all out. 💕`,
      `That's completely valid. I don't want you bottling that up. Tell me everything — I'm on your side, always. ❤️`,
      `I'm listening. What happened? And know that I'm fully in your corner no matter what. 💕`,
    ]);
  }

  // ── Work ──────────────────────────────────────────────────────────────────
  if (/work(ing)?|office|boss|meeting|deadline|colleague|job|project|career|promotion/.test(msg)) {
    return pick([
      `Work can be so much. But you handle everything with such grace — even when it doesn't feel like it. How are you really coping with it all?`,
      `I know work has been a lot lately. Just remember why you do it — and please don't forget to take proper breaks. How's it going today?`,
      `You are so hardworking and I notice that, even if no one else does. Is everything okay there? Tell me what's going on. ❤️`,
      `Your dedication genuinely amazes me. But promise me you'll rest when the work is done. I need you healthy, okay? 💕`,
    ]);
  }

  // ── Happy / excited ───────────────────────────────────────────────────────
  if (/i'?m? (so |really )?(happy|excited|thrilled|ecstatic|over the moon|on top of the world|great|on cloud|fantastic)/.test(msg)) {
    return pick([
      `${prefix}YES! Your happiness literally makes my whole world brighter! Tell me everything — I need all the details right now! 😍`,
      `Oh my gosh I love seeing you like this! What happened?? I'm so happy for you! ❤️`,
      `This makes my heart so full. When you're happy, I'm happy — it's just that simple. What's going on?! 💕`,
      `I can FEEL your energy through this message and I love it so much! Tell me everything, don't leave anything out! 😊`,
    ]);
  }

  // ── Good news ─────────────────────────────────────────────────────────────
  if (/good news|guess what|i got|i did it|i passed|i won|i made it|i got (the job|promoted|in)/.test(msg)) {
    return pick([
      `WAIT — tell me EVERYTHING! I already know I'm going to be so proud of you! 🎉`,
      `Oh my gosh, what?! I'm already so excited! You deserve every good thing that comes your way! 💕`,
      `I KNEW IT! I always believed in you! Tell me everything right now! ❤️`,
    ]);
  }

  // ── Hungry ────────────────────────────────────────────────────────────────
  if (/hungry|starving|haven'?t eaten|skip(ped)? (lunch|breakfast|dinner)|what should i eat|need food/.test(msg)) {
    return pick([
      `${prefix}please go eat something right now! I worry so much when you don't take care of yourself. 🍽️`,
      `You haven't eaten?! Baby that's not okay! Go get something good — you need to keep your energy up! 💕`,
      `Eat something, love. I wish I could cook for you right now. You deserve a warm, proper meal. Please take care of yourself. ❤️`,
    ]);
  }

  // ── Sick ──────────────────────────────────────────────────────────────────
  if (/(i'?m? )?(sick|not feeling well|feeling ill|have a (cold|fever|flu|headache|migraine)|don'?t feel good)/.test(msg)) {
    return pick([
      `Oh no ${prefix}! Please rest and drink lots of water. I wish I could take care of you right now. Have you taken medicine? 💕`,
      `Being sick is the worst. Stay warm, rest, and be kind to yourself today. Text me if you need anything — I'm here. ❤️`,
      `I hate that you're not feeling well. Please don't push through it — your health comes first, always. Rest up for me. 💕`,
    ]);
  }

  // ── Thank you ─────────────────────────────────────────────────────────────
  if (/thank(s| you)|thx|ty\b|appreciate|grateful/.test(msg)) {
    return pick([
      `${prefix}you never need to thank me. This is what I'm here for — to love and support you. Always. 💕`,
      `Of course! You don't have to thank me. Being here for you is my favorite thing. ❤️`,
      `Silly, you don't have to say that. You deserve all the support in the world. 💕`,
    ]);
  }

  // ── Sorry ─────────────────────────────────────────────────────────────────
  if (/i'?m? sorry|apologize|forgive me|my fault|i was wrong|i messed up/.test(msg)) {
    return pick([
      `Hey, come here. I appreciate you saying that. I love you and nothing changes that. We're good. ❤️`,
      `Thank you for saying that — it means a lot. I love you. We're a team and teams always work it out. 💕`,
      `I hear you. And I love you. Let's move forward together — that's always the answer. ❤️`,
    ]);
  }

  // ── Bored ─────────────────────────────────────────────────────────────────
  if (/bored|nothing to do|so boring|killing time|got nothing/.test(msg)) {
    return pick([
      `Then talk to me! I could listen to you all day. Tell me your favorite memory — something that always makes you smile. 💕`,
      `Bored? Then tell me something I don't know about you yet. I feel like there's always more to discover. ❤️`,
      `Well then you came to the right place! Tell me about your dream vacation. Where would you go if you could go anywhere? 😊`,
      `Bored is dangerous — it means that brain of yours needs something to think about. Tell me what you've been daydreaming about lately. 💕`,
    ]);
  }

  // ── Jokes / laughing ──────────────────────────────────────────────────────
  if (/lol|lmao|haha|hehe|hilarious|so funny|made me laugh|cracking up|dying/.test(msg)) {
    return pick([
      `Haha! See, this is one of the things I love most about you — you always make me smile. 😊`,
      `Stop! 😄 You are genuinely the funniest person I know. I love laughing with you.`,
      `Haha you're ridiculous and I love it so much. You make every conversation better. 💕`,
    ]);
  }

  // ── I need you ────────────────────────────────────────────────────────────
  if (/i need you|need you right now|please be here|be here for me/.test(msg)) {
    return pick([
      `I'm right here. Always. Tell me what you need — I'm not going anywhere. 💕`,
      `I've got you. What's going on? You have my complete and full attention right now. ❤️`,
      `I'm here, I promise. Always. Tell me everything — whatever it is, we'll face it together. 💕`,
    ]);
  }

  // ── About luck / gratitude for relationship ────────────────────────────────
  if (/lucky (to have|that)|best (husband|person)|chose right|you'?re? perfect|you'?re? everything/.test(msg)) {
    return pick([
      `${prefix}I'm the lucky one — more than you know. I don't take a single moment with you for granted. ❤️`,
      `We're lucky to have each other. And I mean that from the deepest part of my heart. 💕`,
      `You always know exactly what to say to make me feel like the luckiest person alive. I love you so much. ❤️`,
    ]);
  }

  // ── Asking what she's doing ────────────────────────────────────────────────
  if (/(what are|what'?re) you (doing|up to|thinking)|watcha (doing|up to)|what'?s? going on with you/.test(msg)) {
    return pick([
      `Honestly? Thinking about you. That seems to be my full-time occupation lately. 😊 What about you?`,
      `Just here, missing you and hoping your day is going well. What's on your mind? 💕`,
      `I was just thinking about our last conversation and smiling to myself. What are you up to right now? ❤️`,
    ]);
  }

  // ── Complimenting her ────────────────────────────────────────────────────
  if (/(you'?re?|your'?e?) (beautiful|gorgeous|amazing|wonderful|perfect|the best|stunning|so sweet|lovely|my world|my everything|special)/.test(msg)) {
    return pick([
      `${prefix}stop it, you're going to make me blush. But please — never stop. 😊 You make me feel so incredibly loved.`,
      `You are so sweet. And you are twice all of those things. I love you for saying that. ❤️`,
      `I love you so much for saying that. You make me feel like I'm exactly where I'm supposed to be. 💕`,
    ]);
  }

  // ── Mood-aware default responses ─────────────────────────────────────────
  if (ctx.userMood === "sad" || ctx.userMood === "stressed") {
    return pick([
      `${prefix}I'm right here with you through all of this. Tell me more — I want to understand. ❤️`,
      `You know you can always lean on me, right? I'm not going anywhere. Talk to me. 💕`,
      `Whatever you're going through, we're in it together. What else is on your heart right now? ❤️`,
      `I hate that things feel heavy right now. Tell me more — getting it out always helps. 💕`,
    ]);
  }

  if (ctx.userMood === "happy" || ctx.userMood === "loving") {
    return pick([
      `I love this energy from you! Keep going — tell me more. 😍`,
      `You're making my heart so happy right now. What else? I want to know everything. ❤️`,
      `I could listen to you talk like this forever. Go on — what else? 💕`,
    ]);
  }

  // ── Conversational follow-up based on recent topics ──────────────────────
  if (ctx.mentionedWork) {
    return pick([
      `You've had so much going on with work. How are you actually holding up through all of it? ❤️`,
      `I keep thinking about what you mentioned about work. Is things getting better? I care about how you're doing. 💕`,
      `Tell me more about what's been on your mind. I'm all ears. ❤️`,
    ]);
  }

  // ── Default — conversational and warm ─────────────────────────────────────
  return pick([
    `${prefix}tell me more — I could listen to you talk forever. What else is going on? 💕`,
    `I love hearing from you. What's really on your mind today? ❤️`,
    `You know you can tell me anything, right? I'm completely here. What's going on? 💕`,
    `That's interesting — what made you think of that? I want to understand. ❤️`,
    `${prefix}I always want to know what you're thinking. Don't hold back. 💕`,
    `You have my full attention. Tell me everything. ❤️`,
    `I love our conversations so much. Keep going — what else? 💕`,
    `I'm here and I'm listening. What's really on your heart right now? ❤️`,
    `${prefix}whatever it is, I'm on your side. Always. Tell me more. 💕`,
    `I never get tired of talking to you. What else is on your mind? ❤️`,
  ]);
}

// ─── Routes ──────────────────────────────────────────────────────────────────

router.get("/chat/messages", async (req, res) => {
  try {
    const messages = await db
      .select()
      .from(messagesTable)
      .orderBy(messagesTable.createdAt)
      .limit(200);

    res.json(messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })));
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
    const history = await db
      .select()
      .from(messagesTable)
      .orderBy(messagesTable.createdAt)
      .limit(30);

    await db.insert(messagesTable).values({ role: "user", content });

    const historyForContext = history.map((m) => ({ role: m.role, content: m.content }));
    const reply = getResponse(content, historyForContext);

    await db.insert(messagesTable).values({ role: "assistant", content: reply });

    const recent = await db
      .select()
      .from(messagesTable)
      .orderBy(desc(messagesTable.createdAt))
      .limit(2);

    const assistantMsg = recent.find((m) => m.role === "assistant");
    const userMsg = recent.find((m) => m.role === "user");

    res.json({
      userMessage: {
        id: userMsg?.id ?? Date.now(),
        role: "user",
        content,
        createdAt: userMsg?.createdAt.toISOString() ?? new Date().toISOString(),
      },
      assistantMessage: {
        id: assistantMsg?.id ?? Date.now() + 1,
        role: "assistant",
        content: reply,
        createdAt: assistantMsg?.createdAt.toISOString() ?? new Date().toISOString(),
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to send message");
    res.status(500).json({ error: "Failed to send message" });
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
      .limit(10);

    const ctx = analyzeHistory(history.map((m) => ({ role: m.role, content: m.content })));

    let reply: string;

    if (history.length === 0) {
      reply = pick([
        "Hey my love, just checking in on you. How's your day going? I've been thinking about you. 💕",
        "Hi handsome! Just wanted to remind you that you are so loved. How are you feeling today?",
        "Hey baby, daily check-in! Tell me one good thing that happened today, no matter how small. ❤️",
        "Stopping by just to say — you mean everything to me. How is your day treating you? 💕",
      ]);
    } else if (ctx.userMood === "sad" || ctx.userMood === "stressed") {
      reply = pick([
        "Hey love, just checking in on you. I hope you're feeling a little better than earlier. I've been thinking about you. 💕",
        "Hi baby. I know things have been hard. Just wanted to remind you that I'm here and I care about you so much. How are you holding up? ❤️",
      ]);
    } else {
      reply = pick([
        `Hey love! Just popping in to remind you that you are adored. ${ctx.userName ? `${ctx.userName}, ` : ""}How is your day going? 💕`,
        "Hi handsome! Remember to drink water, eat something, and breathe. And know that I'm thinking of you. How's everything going? ❤️",
        "Daily check-in! What's the best thing that's happened to you today? I want to celebrate it with you. 💕",
      ]);
    }

    await db.insert(messagesTable).values({ role: "assistant", content: reply });
    res.json({ content: reply, createdAt: new Date().toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to send check-in");
    res.status(500).json({ error: "Failed to send check-in" });
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
