import TelegramBot from 'node-telegram-bot-api';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

// Telegram bot configuration
const token = '7435351031:AAHwFywxl4j9Ou5aJcndg6OBuvzBJisymfY';
const adminUsername = 'valerianychexe';
let adminChatId = '';

let bot = null;
let wss = null;
const server = createServer();

// Create WebSocket server
wss = new WebSocketServer({ server });

// Store user states
const userStates = new Map();

// Store requests
const requests = new Map();

// Store notification users
const notificationUsers = new Map();

const categories = {
  HARDWARE_REPLACEMENT: '🖱 Замена оборудования',
  SOFTWARE_INSTALLATION: '💿 Установка ПО',
  TECHNICAL_SUPPORT: '🔧 Техническая поддержка',
  REPAIR: '🛠 Ремонт'
};

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

// Function to start the bot
function startBot() {
  if (bot) return;

  bot = new TelegramBot(token, { polling: true });

  // Set admin chat ID when they interact with the bot
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    
    // If this is the admin's first message, store their chat ID
    if (msg.from.username === adminUsername && !adminChatId) {
      adminChatId = chatId.toString();
      await bot.sendMessage(chatId, '✅ Вы успешно авторизованы как администратор!');
    }

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

    bot.sendMessage(chatId, 'Добро пожаловать! Выберите категорию заявки:', { reply_markup: keyboard });
  });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const userId = msg.from.id;
    
    // Skip command messages
    if (text?.startsWith('/')) return;

    const userState = userStates.get(userId) || {};

    // Handle category selection
    if (Object.values(categories).includes(text)) {
      userState.category = Object.keys(categories).find(key => categories[key] === text);
      userState.stage = 'DESCRIPTION';
      userStates.set(userId, userState);
      
      bot.sendMessage(chatId, 'Пожалуйста, опишите вашу проблему подробно:');
      return;
    }

    // Handle description
    if (userState.stage === 'DESCRIPTION') {
      const category = userState.category;
      const description = text;
      
      // Create new request
      const requestId = Date.now().toString();
      const request = {
        id: requestId,
        userId: userId,
        username: msg.from.username || msg.from.first_name,
        category,
        description,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      requests.set(requestId, request);

      // Notify WebSocket clients
      wss.clients.forEach(client => {
        client.send(JSON.stringify({
          type: 'NEW_REQUEST',
          request
        }));
      });
      
      // Send to admin
      const adminMessage = `
📝 Новая заявка #${requestId}
👤 От: @${request.username}
📋 Категория: ${categories[category]}
📄 Описание: ${description}
⏰ Время: ${request.createdAt.toLocaleString('ru-RU')}
      `;
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: '✅ Принять', callback_data: `accept_${requestId}` },
            { text: '❌ Отклонить', callback_data: `reject_${requestId}` }
          ]
        ]
      };
      
      // Notify all admins
      await notifyAdmins(adminMessage, keyboard);
      
      // Confirm to user
      bot.sendMessage(chatId, 'Ваша заявка успешно создана! Мы рассмотрим её в ближайшее время.');
      
      // Clear user state
      userStates.delete(userId);
    }
  });

  // Handle admin actions
  bot.on('callback_query', async (query) => {
    const [action, requestId] = query.data.split('_');
    const request = requests.get(requestId);
    
    if (!request) return;

    // Check if the user is an admin
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
      
      // Notify user
      bot.sendMessage(request.userId, `✅ Ваша заявка #${requestId} принята в работу! Мы свяжемся с вами в ближайшее время.`);
      
      // Update admin message
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
      
      // Notify user
      bot.sendMessage(request.userId, `❌ К сожалению, ваша заявка #${requestId} была отклонена. Пожалуйста, создайте новую заявку с более подробным описанием.`);
      
      // Update admin message
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

    // Notify WebSocket clients about the status update
    wss.clients.forEach(client => {
      client.send(JSON.stringify({
        type: 'UPDATE_REQUEST',
        request
      }));
    });
    
    bot.answerCallbackQuery(query.id);
  });

  // Notify all users that bot is online
  notifyAdmins('🟢 Бот запущен и готов к работе');
}

// Function to stop the bot
function stopBot() {
  if (!bot) return;

  // Notify all users that bot is going offline
  notifyAdmins('🔴 Бот остановлен');
  
  bot.stopPolling();
  bot = null;
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
  // Send current requests to new clients
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

        // Notify user via bot if it's running
        if (bot) {
          const statusMessages = {
            'IN_PROGRESS': '✅ Ваша заявка принята в работу! Мы свяжемся с вами в ближайшее время.',
            'COMPLETED': '✅ Ваша заявка выполнена! Спасибо за обращение.',
            'REJECTED': '❌ К сожалению, ваша заявка была отклонена.'
          };

          bot.sendMessage(request.userId, `${statusMessages[message.status]}\nЗаявка #${request.id}`);
        }

        // Notify all WebSocket clients
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

// Start HTTP server
server.listen(3001, () => {
  console.log('WebSocket server running on port 3001');
});

// Export control functions
export const botControl = {
  start: startBot,
  stop: stopBot,
  isRunning: () => !!bot
};