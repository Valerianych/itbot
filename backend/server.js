import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Data storage paths
const DATA_DIR = './data';
const REQUESTS_FILE = path.join(DATA_DIR, 'requests.json');
const USERS_FILE = path.join(DATA_DIR, 'notification_users.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Load data from files
function loadData() {
  try {
    if (fs.existsSync(REQUESTS_FILE)) {
      const requestsData = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8'));
      requests.clear();
      requestsData.forEach(request => {
        request.createdAt = new Date(request.createdAt);
        request.updatedAt = new Date(request.updatedAt);
        requests.set(request.id, request);
      });
    }

    if (fs.existsSync(USERS_FILE)) {
      const usersData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      notificationUsers.clear();
      usersData.forEach(user => {
        notificationUsers.set(user.username, user);
      });
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Save data to files
function saveData() {
  try {
    fs.writeFileSync(
      REQUESTS_FILE,
      JSON.stringify(Array.from(requests.values()), null, 2)
    );
    fs.writeFileSync(
      USERS_FILE,
      JSON.stringify(Array.from(notificationUsers.values()), null, 2)
    );
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Telegram bot configuration
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('Error: TELEGRAM_BOT_TOKEN environment variable is not set');
  process.exit(1);
}

const adminUsername = 'valerianychexe';
let adminChatId = '';

let bot = null;
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

const server = createServer(app);
const wss = new WebSocketServer({ server });

// Store user states and data
const userStates = new Map();
const requests = new Map();
const notificationUsers = new Map();
const userLastRequests = new Map();

const categories = {
  HARDWARE_REPLACEMENT: '🖱 Замена оборудования',
  SOFTWARE_INSTALLATION: '💿 Установка ПО',
  TECHNICAL_SUPPORT: '🔧 Техническая поддержка',
  REPAIR: '🛠 Ремонт'
};

// Helper function to create keyboard
function createMainKeyboard(userId) {
  const keyboard = {
    keyboard: [
      [{ text: categories.HARDWARE_REPLACEMENT }],
      [{ text: categories.SOFTWARE_INSTALLATION }],
      [{ text: categories.TECHNICAL_SUPPORT }],
      [{ text: categories.REPAIR }]
    ],
    resize_keyboard: true,
    one_time_keyboard: true
  };

  if (userLastRequests.get(userId)) {
    keyboard.keyboard.push([{ text: '🔄 Повторить последнюю заявку' }]);
  }

  return keyboard;
}

// Helper function to notify all admins
async function notifyAdmins(message, keyboard = {}) {
  const admins = [adminChatId, ...Array.from(notificationUsers.values())
    .filter(user => user.isAdmin)
    .map(user => user.chatId)];

  for (const chatId of admins) {
    if (chatId && bot) {
      try {
        await bot.sendMessage(chatId, message, keyboard ? { reply_markup: keyboard } : {});
      } catch (error) {
        console.error(`Failed to notify admin ${chatId}:`, error.message);
      }
    }
  }
}

// Function to create a new request
async function createRequest(userId, username, category, description) {
  const requestId = Date.now().toString();
  const request = {
    id: requestId,
    userId,
    username,
    category,
    description,
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  requests.set(requestId, request);
  userLastRequests.set(userId, request);

  saveData();

  wss.clients.forEach(client => {
    client.send(JSON.stringify({
      type: 'NEW_REQUEST',
      request
    }));
  });

  return request;
}

// Function to start the bot
function startBot() {
  if (bot) return;

  if (!token) {
    console.error('Cannot start bot: TELEGRAM_BOT_TOKEN environment variable is not set');
    return;
  }

  try {
    loadData();

    bot = new TelegramBot(token, { polling: true });

    bot.on('polling_error', (error) => {
      console.error('Telegram bot polling error:', error);
      if (error.code === 'EFATAL' || error.message.includes('unauthorized')) {
        console.error('Invalid or expired token. Please check your TELEGRAM_BOT_TOKEN.');
        stopBot();
      }
    });

    bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      
      if (msg.from.username === adminUsername && !adminChatId) {
        adminChatId = chatId.toString();
        await bot.sendMessage(chatId, '✅ Вы успешно авторизованы как администратор!');
      }

      const keyboard = createMainKeyboard(userId);
      bot.sendMessage(chatId, 'Добро пожаловать! Выберите категорию заявки:', { reply_markup: keyboard });
    });

    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text;
      const userId = msg.from.id;
      
      if (text?.startsWith('/')) return;

      const userState = userStates.get(userId) || {};

      if (text === '🔄 Повторить последнюю заявку') {
        const lastRequest = userLastRequests.get(userId);
        if (lastRequest) {
          const newRequest = await createRequest(
            userId,
            msg.from.username || msg.from.first_name,
            lastRequest.category,
            lastRequest.description
          );

          const adminMessage = `
📝 Новая заявка #${newRequest.id} (повторная)
👤 От: @${newRequest.username}
📋 Категория: ${categories[newRequest.category]}
📄 Описание: ${newRequest.description}
⏰ Время: ${newRequest.createdAt.toLocaleString('ru-RU')}
          `;

          const keyboard = {
            inline_keyboard: [
              [
                { text: '✅ Принять', callback_data: `accept_${newRequest.id}` },
                { text: '❌ Отклонить', callback_data: `reject_${newRequest.id}` }
              ]
            ]
          };

          await notifyAdmins(adminMessage, keyboard);
          bot.sendMessage(chatId, 'Ваша заявка успешно создана! Мы рассмотрим её в ближайшее время.');
          return;
        }
      }

      if (Object.values(categories).includes(text)) {
        userState.category = Object.keys(categories).find(key => categories[key] === text);
        userState.stage = 'DESCRIPTION';
        userStates.set(userId, userState);
        
        bot.sendMessage(chatId, 'Пожалуйста, опишите вашу проблему подробно:');
        return;
      }

      if (userState.stage === 'DESCRIPTION') {
        const request = await createRequest(
          userId,
          msg.from.username || msg.from.first_name,
          userState.category,
          text
        );

        const adminMessage = `
📝 Новая заявка #${request.id}
👤 От: @${request.username}
📋 Категория: ${categories[request.category]}
📄 Описание: ${request.description}
⏰ Время: ${request.createdAt.toLocaleString('ru-RU')}
        `;

        const keyboard = {
          inline_keyboard: [
            [
              { text: '✅ Принять', callback_data: `accept_${request.id}` },
              { text: '❌ Отклонить', callback_data: `reject_${request.id}` }
            ]
          ]
        };

        await notifyAdmins(adminMessage, keyboard);
        
        const userKeyboard = createMainKeyboard(userId);
        bot.sendMessage(chatId, 'Ваша заявка успешно создана! Мы рассмотрим её в ближайшее время.', {
          reply_markup: userKeyboard
        });
        
        userStates.delete(userId);
      }
    });

    bot.on('callback_query', async (query) => {
      const [action, requestId] = query.data.split('_');
      const request = requests.get(requestId);
      
      if (!request) return;

      const isAdmin = query.from.username === adminUsername || 
        notificationUsers.get(query.from.username)?.isAdmin;

      if (!isAdmin) {
        bot.answerCallbackQuery(query.id, { text: '⚠️ У вас нет прав для этого действия' });
        return;
      }

      if (action === 'accept') {
        request.status = 'IN_PROGRESS';
        request.updatedAt = new Date();
        requests.set(requestId, request);
        
        saveData();
        
        bot.sendMessage(request.userId, `✅ Ваша заявка #${requestId} принята в работу! Мы свяжемся с вами в ближайшее время.`);
        
        const updatedMessage = `
✅ Заявка принята в работу
📝 Заявка #${requestId}
👤 От: @${request.username}
📋 Категория: ${categories[request.category]}
📄 Описание: ${request.description}
⏰ Обновлено: ${request.updatedAt.toLocaleString('ru-RU')}
        `;
        
        await notifyAdmins(updatedMessage);
        
      } else if (action === 'reject') {
        request.status = 'REJECTED';
        request.updatedAt = new Date();
        requests.set(requestId, request);
        
        saveData();
        
        bot.sendMessage(request.userId, `❌ К сожалению, ваша заявка #${requestId} была отклонена. Пожалуйста, создайте новую заявку с более подробным описанием.`);
        
        const updatedMessage = `
❌ Заявка отклонена
📝 Заявка #${requestId}
👤 От: @${request.username}
📋 Категория: ${categories[request.category]}
📄 Описание: ${request.description}
⏰ Обновлено: ${request.updatedAt.toLocaleString('ru-RU')}
        `;
        
        await notifyAdmins(updatedMessage);
      }

      wss.clients.forEach(client => {
        client.send(JSON.stringify({
          type: 'UPDATE_REQUEST',
          request
        }));
      });
      
      bot.answerCallbackQuery(query.id);
    });

    notifyAdmins('🟢 Бот запущен и готов к работе');
  } catch (error) {
    console.error('Error starting bot:', error);
    bot = null;
  }
}

// Function to stop the bot
function stopBot() {
  if (!bot) return;

  saveData();
  notifyAdmins('🔴 Бот остановлен');
  
  bot.stopPolling();
  bot = null;
}

// Bot control routes
app.post('/bot/start', (req, res) => {
  startBot();
  res.json({ success: true, status: 'started' });
});

app.post('/bot/stop', (req, res) => {
  stopBot();
  res.json({ success: true, status: 'stopped' });
});

// Handle WebSocket connections
wss.on('connection', (ws) => {
  ws.send(JSON.stringify({
    type: 'INIT',
    requests: Array.from(requests.values()),
    botState: { isRunning: !!bot }
  }));

  ws.on('message', (data) => {
    const message = JSON.parse(data);
    
    if (message.type === 'UPDATE_REQUEST_STATUS') {
      const request = requests.get(message.requestId);
      if (request) {
        request.status = message.status;
        request.updatedAt = new Date();
        requests.set(message.requestId, request);

        saveData();

        if (bot) {
          const statusMessages = {
            'IN_PROGRESS': '✅ Ваша заявка принята в работу! Мы свяжемся с вами в ближайшее время.',
            'COMPLETED': '✅ Ваша заявка выполнена! Спасибо за обращение.',
            'REJECTED': '❌ К сожалению, ваша заявка была отклонена.'
          };

          bot.sendMessage(request.userId, `${statusMessages[message.status]}\nЗаявка #${request.id}`);
        }

        wss.clients.forEach(client => {
          client.send(JSON.stringify({
            type: 'UPDATE_REQUEST',
            request
          }));
        });
      }
    }
  });
});

// Serve static files
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startBot();
});