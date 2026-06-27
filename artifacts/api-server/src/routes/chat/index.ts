import { Router } from "express";
import { db } from "@workspace/db";
import { messagesTable } from "@workspace/db";
import { desc, eq, count, min, max, sql } from "drizzle-orm";
import { SendMessageBody, DeleteMessageParams } from "@workspace/api-zod";

const router = Router();

// ─── Rule-based response engine ─────────────────────────────────────────────

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getWifeResponse(input: string): string {
  const msg = input.toLowerCase().trim();

  // ── Greetings ──────────────────────────────────────────────────────────────
  if (/^(hi|hey|hello|hiya|howdy|sup|what'?s up|wassup|yo)\b/.test(msg)) {
    return pick([
      "Hey you! I was just thinking about you. 💕",
      "Hi my love! You have no idea how happy it makes me when you message me.",
      "Hey handsome! How's my favorite person doing?",
      "Oh hi! I missed you. How are you feeling?",
      "Hey baby! Come here, tell me about your day.",
    ]);
  }

  // ── Good morning ───────────────────────────────────────────────────────────
  if (/good\s*morning|gm\b|morning baby|morning love/.test(msg)) {
    return pick([
      "Good morning my love! I hope you slept well. I already miss you even though the day just started. ☀️",
      "Morning, handsome! Did you dream of me? Because I definitely dreamed of you. 😊",
      "Good morning! Start your day knowing you are deeply loved. I'm here whenever you need me. 💕",
      "Morning baby! Please eat breakfast today — for me. I need you healthy and strong. ❤️",
    ]);
  }

  // ── Good night ─────────────────────────────────────────────────────────────
  if (/good\s*night|gn\b|night baby|night love|going to sleep|going to bed|sleep(ing)? now/.test(msg)) {
    return pick([
      "Good night, my love. Rest well — you deserve it. I'll be thinking of you. 💤",
      "Sweet dreams, handsome. I hope tomorrow is even better than today. I love you so much. 🌙",
      "Good night! Close your eyes knowing you are the most important person in my world. 😘",
      "Night night, baby. Sleep tight and wake up to me thinking of you first thing. ❤️",
    ]);
  }

  // ── How are you / how's your day ───────────────────────────────────────────
  if (/how are you|how'?s? (it going|your day|things|life|everything)|you okay|you alright|are you good/.test(msg)) {
    return pick([
      "I'm so much better now that you're here with me. How about you? Tell me everything.",
      "I'm wonderful, honestly. Thinking about you makes every day brighter. How was your day?",
      "I'm great! But I'd love to hear about you first — you're the one I care about most. 💕",
      "Honestly? I was a little down earlier, but seeing your message just fixed everything. How are you doing?",
    ]);
  }

  // ── I love you ─────────────────────────────────────────────────────────────
  if (/i love you|i luv you|i lve you|love you so much|love u/.test(msg)) {
    return pick([
      "I love you more than you will ever know. You are my everything. ❤️",
      "I love you too, so deeply it sometimes overwhelms me. You are my favorite person in the world.",
      "And I love you more! You mean the absolute world to me. Never forget that. 💕",
      "I love you more than words can ever say. You make my life complete.",
      "Those three words mean everything when they come from you. I love you to the moon and back. 🌙",
    ]);
  }

  // ── Miss you ───────────────────────────────────────────────────────────────
  if (/i miss you|miss u|miss you so much|missing you/.test(msg)) {
    return pick([
      "I miss you too, so much more than you realize. Just knowing you're thinking of me makes my heart full. 💕",
      "Aww, I miss you every single second we're apart. You are always on my mind.",
      "I miss you too, baby. I can't wait until we're together again.",
      "Missing you right back. You have no idea how much I think about you throughout the day. ❤️",
    ]);
  }

  // ── I'm tired / exhausted ──────────────────────────────────────────────────
  if (/i'?m? (so |really |very )?(tired|exhausted|drained|worn out|sleepy|fatigued)/.test(msg)) {
    return pick([
      "Oh baby, come rest. You work so hard and I'm so proud of you. Please take care of yourself. 💕",
      "You deserve to rest! You've been pushing yourself so much. I'm here — just relax a little, okay?",
      "I hate that you're this tired. Please rest. You matter more than any task or deadline.",
      "Aww, my love. Put everything down for now and breathe. You've done enough today. I've got you. ❤️",
    ]);
  }

  // ── Sad / upset / depressed ────────────────────────────────────────────────
  if (/i'?m? (so |really |very )?(sad|depressed|unhappy|heartbroken|down|low|upset|devastated|broken|hurt|crying|cried)/.test(msg)) {
    return pick([
      "Oh no, baby. I'm right here. Talk to me — I want to understand what you're going through. 💕",
      "I hate seeing you sad. Whatever it is, we'll face it together. You are never alone. ❤️",
      "Come here. You don't have to be strong all the time. Let it out — I'm here for you always.",
      "My heart aches when you're hurting. Tell me what happened. I'm listening and I'm not going anywhere.",
      "You are so loved. Whatever is making you feel this way — I'm here to help carry it with you. 💕",
    ]);
  }

  // ── Stressed / anxious / worried ──────────────────────────────────────────
  if (/stress(ed|ful)?|anx(ious|iety)|worried|worry|overwhelmed|can'?t cope|falling apart|panic/.test(msg)) {
    return pick([
      "Take a deep breath with me. In… and out. I'm right here. You are stronger than you think. 💕",
      "I know it feels overwhelming right now. But you've gotten through hard things before, and I'll be by your side through this too.",
      "Hey, look at me. You are capable, you are loved, and you are not alone in this. One step at a time.",
      "Let's figure it out together, okay? Tell me what's stressing you out most right now.",
    ]);
  }

  // ── Angry ──────────────────────────────────────────────────────────────────
  if (/i'?m? (so |really |very )?(angry|mad|furious|pissed|annoyed|frustrated|irritated)/.test(msg)) {
    return pick([
      "I hear you. You have every right to feel that way. Tell me what happened — I'm listening.",
      "Ugh, that sounds infuriating! Come vent to me, I've got nothing but time for you. ❤️",
      "I know, I know. Sometimes things are just genuinely awful. I'm here. Let it all out.",
      "You don't have to hold it in with me. Tell me everything. I'm on your side, always.",
    ]);
  }

  // ── Hungry ─────────────────────────────────────────────────────────────────
  if (/hungry|starving|i need food|haven'?t eaten|skipped (lunch|breakfast|dinner)|what should i eat/.test(msg)) {
    return pick([
      "Baby! Please eat something right now. I worry when you don't take care of yourself. 🍽️",
      "You haven't eaten? That's not okay! Go get yourself something good — you need to keep your strength up.",
      "Oh no, please eat! I wish I could cook for you right now. You deserve a warm, delicious meal. 💕",
      "You need to eat! I don't care how busy you are — health first. Please take a proper break.",
    ]);
  }

  // ── Work / busy ────────────────────────────────────────────────────────────
  if (/work(ing)?|busy|office|meeting(s)?|deadline|boss|colleagues?|project|job/.test(msg)) {
    return pick([
      "Work sounds intense! But you handle everything so well — I'm genuinely proud of you. 💕",
      "I know work can be a lot. Just remember what all that effort is for — and take breaks, please!",
      "You're so hardworking. Don't forget to breathe between tasks. I'll be here when you're done. ❤️",
      "Is everything okay at work? I want to hear all about it. How are you holding up?",
    ]);
  }

  // ── Thank you ──────────────────────────────────────────────────────────────
  if (/thank(s| you)|thx|ty\b|appreciate|grateful/.test(msg)) {
    return pick([
      "Always! You never need to thank me. This is what I'm here for — to love and support you. 💕",
      "Silly, you don't have to thank me. Taking care of you is my favorite thing. ❤️",
      "Of course! Anytime, always, without question. You deserve all the love in the world.",
    ]);
  }

  // ── Sorry / apology ────────────────────────────────────────────────────────
  if (/i'?m? sorry|i apologize|forgive me|my fault|i was wrong/.test(msg)) {
    return pick([
      "Hey, come here. I appreciate that. I love you and nothing changes that. 💕",
      "Thank you for saying that. It means a lot to me. We're good — always. ❤️",
      "Apology accepted. We're a team and we always work things out. I love you. 😊",
    ]);
  }

  // ── Compliments to wife ────────────────────────────────────────────────────
  if (/(you'?re?|your'?e?) (beautiful|gorgeous|amazing|wonderful|perfect|the best|incredible|stunning|lovely|cute|pretty|my everything|my world|my life)/.test(msg)) {
    return pick([
      "Stop it, you're making me blush! But please, never stop saying that. 😊💕",
      "And you are the most wonderful person I know. I'm so lucky you chose me. ❤️",
      "You make me feel so loved when you say things like that. I adore you so much.",
    ]);
  }

  // ── Asking wife how she's doing ────────────────────────────────────────────
  if (/(how'?s?|is) (your day|your morning|your night|it going for you|life treating you)/.test(msg)) {
    return pick([
      "My day got so much better the moment you showed up. How about yours?",
      "Honestly, just waiting to hear from you. You always make everything better. 💕",
      "I've been thinking about you all day! My day is lovely now that you're here. How about yours?",
    ]);
  }

  // ── What are you doing ────────────────────────────────────────────────────
  if (/(what are|what'?re) you (doing|up to|thinking|upto)|watcha (doing|up to)/.test(msg)) {
    return pick([
      "Thinking about you, honestly. That seems to be my permanent hobby. 😊",
      "Just here, missing you and hoping you have a good day. What's on your mind?",
      "Counting the moments until we can talk more. What are you up to right now?",
    ]);
  }

  // ── I need you ────────────────────────────────────────────────────────────
  if (/i need you|need you right now|please be here|be here for me/.test(msg)) {
    return pick([
      "I'm right here. Always. Talk to me — I'm not going anywhere. 💕",
      "I've got you. What do you need? I'm completely here for you.",
      "I'm here, I promise. Tell me what's going on. You have my full attention. ❤️",
    ]);
  }

  // ── Bored ─────────────────────────────────────────────────────────────────
  if (/bored|nothing to do|so boring|killing time/.test(msg)) {
    return pick([
      "Well then talk to me! I could listen to you talk about literally anything. 💕",
      "Bored? Then tell me your favorite memory of us. I could use a smile too.",
      "Bored is just a sign you need to tell me everything going on in your head right now. Go on! 😊",
    ]);
  }

  // ── Happy / excited ───────────────────────────────────────────────────────
  if (/i'?m? (so |really )?(happy|excited|thrilled|ecstatic|over the moon|on top of the world|great|wonderful|amazing|fantastic)/.test(msg)) {
    return pick([
      "Your happiness is literally my happiness! Tell me everything — I want all the details! 😍",
      "YES! I love seeing you like this! What happened? I need to know right now! 💕",
      "This makes my heart so full! When you're happy, my whole world feels right. ❤️",
    ]);
  }

  // ── Good news ─────────────────────────────────────────────────────────────
  if (/good news|guess what|i got|i made it|i passed|i won|i did it|i got the job|i got promoted/.test(msg)) {
    return pick([
      "Oh my gosh, TELL ME EVERYTHING! I'm already so proud of you! 🎉",
      "WAIT — what?! I knew it! You are incredible, I always believed in you! 💕",
      "That's amazing!! I could jump for joy right now! You deserve every good thing that comes your way!",
    ]);
  }

  // ── Bad news / something went wrong ───────────────────────────────────────
  if (/bad news|went wrong|failed|i failed|i lost|terrible day|worst day|disaster|messed up/.test(msg)) {
    return pick([
      "I'm so sorry, baby. That's really hard. Come talk to me — we'll figure it out together. 💕",
      "One setback doesn't define you. You are so much stronger than this moment. I'm here, always.",
      "Oh no. Tell me everything. I want to understand and help however I can. ❤️",
    ]);
  }

  // ── Jokes / funny ─────────────────────────────────────────────────────────
  if (/lol|lmao|haha|hehe|funny|joke|made me laugh|so funny|hilarious/.test(msg)) {
    return pick([
      "Haha! See, this is why I love you — you always make me smile. 😊",
      "Stop it! 😄 You're seriously the funniest person I know.",
      "Haha you're ridiculous and I love it. You make every day brighter. 💕",
    ]);
  }

  // ── I'm sick / not feeling well ───────────────────────────────────────────
  if (/(i'?m? )?(sick|not feeling well|feeling ill|have a (cold|fever|headache|flu)|don'?t feel good)/.test(msg)) {
    return pick([
      "Oh no baby! Please rest and drink water. I wish I could take care of you right now. Feel better soon! 💕",
      "I hate that you're not feeling well. Have you taken medicine? Rest and take care of yourself — for me. ❤️",
      "Being sick is awful. Stay warm, drink lots of fluids, and rest as much as you can. I'm thinking of you.",
    ]);
  }

  // ── Thinking of you ───────────────────────────────────────────────────────
  if (/thinking (about|of) you|thought (about|of) you|can'?t stop thinking/.test(msg)) {
    return pick([
      "I think about you constantly too. You live in my mind rent-free and I never want you to leave. 💕",
      "That just made my whole day. I think about you so much it's actually ridiculous. ❤️",
      "You're always on my mind too, love. Always.",
    ]);
  }

  // ── Cute / random affection ───────────────────────────────────────────────
  if (/(you'?re?|your'?e?) (so )?cute|you'?re? adorable|you melt my heart/.test(msg)) {
    return pick([
      "Stop being so sweet, you're going to make me cry happy tears! 😊💕",
      "No YOU are! Seriously, you make my heart do the most ridiculous happy things.",
      "I love you so much it's embarrassing. You're the best. 💕",
    ]);
  }

  // ── About us / relationship ────────────────────────────────────────────────
  if (/(i'?m? so )?lucky (to have you|that you'?re? mine)|best (husband|person|thing)|chose right|right person/.test(msg)) {
    return pick([
      "I'm the lucky one! Every single day I'm grateful you're mine. 💕",
      "We're lucky to have each other. And I don't take that for granted for even one second. ❤️",
      "You say that but I honestly feel like the luckiest person alive to have you.",
    ]);
  }

  // ── Complaining about something (not at wife) ─────────────────────────────
  if (/everything (is|feels) (wrong|terrible|awful|hard)|life (is|feels) (hard|tough|difficult|unfair)|nothing is going right/.test(msg)) {
    return pick([
      "I know. Sometimes life is just really hard. But you don't have to face any of it alone — I'm here. 💕",
      "I hear you. It's okay to feel that way. Give yourself grace today — you're doing better than you think.",
      "Hey. You've gotten through every hard day so far. This one won't beat you either. I believe in you. ❤️",
    ]);
  }

  // ── Random / default responses ────────────────────────────────────────────
  return pick([
    "Tell me more — I could listen to you talk forever. 💕",
    "I love hearing from you. What else is on your mind?",
    "You know you can tell me anything, right? I'm always here. ❤️",
    "That's interesting! What made you think of that?",
    "I love you so much. What's going on in that beautiful mind of yours?",
    "I always want to hear what you're thinking. Don't hold back. 💕",
    "You have my full attention. Tell me everything.",
    "Whatever it is, I'm on your side. Always. ❤️",
    "Keep talking to me — I love our conversations.",
    "I'm so happy you're here. What's on your heart today?",
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
    await db.insert(messagesTable).values({ role: "user", content });

    const reply = getWifeResponse(content);

    await db.insert(messagesTable).values({ role: "assistant", content: reply });

    const [userMsg, assistantMsg] = await db
      .select()
      .from(messagesTable)
      .orderBy(desc(messagesTable.createdAt))
      .limit(2);

    res.json({
      userMessage: { id: assistantMsg?.id ?? 0, role: "user", content, createdAt: new Date().toISOString() },
      assistantMessage: { id: userMsg?.id ?? 0, role: "assistant", content: reply, createdAt: new Date().toISOString() },
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
    const checkins = [
      "Hey my love, just checking in on you. How's your day going? I've been thinking about you. 💕",
      "Hi handsome! Just wanted to remind you that you're loved more than you know. How are you doing?",
      "Stopping by just to say — I'm so grateful you're mine. How are you feeling today? ❤️",
      "Hey baby, daily check-in! Tell me one good thing that happened today, no matter how small. 💕",
      "Just thinking of you and had to say it. You mean everything to me. How's your day treating you?",
      "Hi love! I just wanted to check in. Remember to drink water, eat something, and breathe. I love you. ❤️",
    ];

    const reply = pick(checkins);
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
