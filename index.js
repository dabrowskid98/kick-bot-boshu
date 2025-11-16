const WebSocket = require("ws");
const axios = require("axios");

const CHANNEL = "Boshu_93"; // Twój kanał Kick
const BOT_NAME = "BoshuBot"; // Nazwa bota (można zmienić)
const TOKEN = process.env.KICK_TOKEN; // token ustawisz na Renderze

const ws = new WebSocket("wss://ws-beta.kick.com/?token=null");

ws.on("open", () => {
  console.log("Połączono z Kick WebSocket!");

  ws.send(
    JSON.stringify({
      event: "pusher:subscribe",
      data: {
        auth: "",
        channel: `chatrooms.${CHANNEL}.v2`,
      },
    })
  );
});

ws.on("message", async (data) => {
  let msg;
  try {
    msg = JSON.parse(data.toString());
  } catch {
    return;
  }

  if (!msg?.data) return;

  let parsed;
  try {
    parsed = JSON.parse(msg.data);
  } catch {
    return;
  }

  // Odbieranie wiadomości
  if (parsed?.content?.message) {
    let author = parsed.content.sender.username;
    let text = parsed.content.message;

    console.log(`${author}: ${text}`);

    // KOMENDA !czaslive
    if (text.toLowerCase() === "!czaslive") {
      const uptime = await getUptime();
      sendChatMessage(`⏱️ Live trwa: ${uptime}`);
    }
  }
});

// Wysyłanie wiadomości na czat
async function sendChatMessage(text) {
  try {
    await axios.post(
      `https://kick.com/api/v2/messages/send/${CHANNEL}`,
      {
        message: text,
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Wysłano:", text);
  } catch (err) {
    console.log("Błąd wysyłania wiadomości:", err.response?.data || err);
  }
}

// Czas live
async function getUptime() {
  try {
    const res = await axios.get(`https://kick.com/api/v1/channels/${CHANNEL}`);
    const live = res.data.livestream;

    if (!live) return "Stream nie jest aktywny.";

    const start = new Date(live.created_at);
    const now = new Date();

    let diff = Math.floor((now - start) / 1000);
    const h = Math.floor(diff / 3600);
    diff %= 3600;
    const m = Math.floor(diff / 60);
    const s = diff % 60;

    return `${h}h ${m}m ${s}s`;
  } catch (err) {
    return "Nie udało się pobrać czasu live.";
  }
}
