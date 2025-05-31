import TelegramBot from 'node-telegram-bot-api';

// Telegram bot configuration
const token = '7435351031:AAHwFywxl4j9Ou5aJcndg6OBuvzBJisymfY';
const adminUsername = 'valerianychexe';
let adminChatId = '';

const bot = new TelegramBot(token, { polling: true });

const categories = {
  HARDWARE_REPLACEMENT: '🖱 Замена оборудования',
  SOFTWARE_INSTALLATION: '💿 Установка ПО',
  TECHNICAL_SUPPORT: '🔧 Техническая поддержка',
  REPAIR: '🛠 Ремонт'
};

// Store user states
const userStates = new Map();

// Store requests
const requests = new Map();

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
    
    // Send to admin
    const adminMessage = `
📝 Новая заявка #${requestId}
👤 От: @${request.username}
📋 Категория: ${categories[category]}
📄 Описание: ${description}
⏰ Время: ${request.createdAt.toLocaleString('ru-RU')}
    `;
    
    // If adminChatId is set, send to admin
    if (adminChatId) {
      const keyboard = {
        inline_keyboard: [
          [
            { text: '✅ Принять', callback_data: `accept_${requestId}` },
            { text: '❌ Отклонить', callback_data: `reject_${requestId}` }
          ]
        ]
      };
      
      bot.sendMessage(adminChatId, adminMessage, { reply_markup: keyboard });
    }
    
    // Confirm to user
    bot.sendMessage(chatId, 'Ваша заявка успешно создана! Мы рассмотрим её в ближайшее время.');
    
    // Clear user state
    userStates.delete(userId);
  }
});

// Handle admin actions
bot.on('callback_query', async (query) => {
  // Verify that the action is coming from admin
  if (query.from.username !== adminUsername) {
    bot.answerCallbackQuery(query.id, { text: '⚠️ У вас нет прав для этого действия' });
    return;
  }

  const [action, requestId] = query.data.split('_');
  const request = requests.get(requestId);
  
  if (!request) return;

  if (action === 'accept') {
    request.status = 'IN_PROGRESS';
    request.updatedAt = new Date();
    requests.set(requestId, request);
    
    // Notify user
    bot.sendMessage(request.userId, `Ваша заявка #${requestId} принята в работу! Мы свяжемся с вами в ближайшее время.`);
    
    // Update admin message
    bot.editMessageText(`✅ Заявка принята в работу\n${query.message.text}`, {
      chat_id: adminChatId,
      message_id: query.message.message_id
    });
  } else if (action === 'reject') {
    request.status = 'REJECTED';
    request.updatedAt = new Date();
    requests.set(requestId, request);
    
    // Notify user
    bot.sendMessage(request.userId, `К сожалению, ваша заявка #${requestId} была отклонена. Пожалуйста, создайте новую заявку с более подробным описанием.`);
    
    // Update admin message
    bot.editMessageText(`❌ Заявка отклонена\n${query.message.text}`, {
      chat_id: adminChatId,
      message_id: query.message.message_id
    });
  }
  
  bot.answerCallbackQuery(query.id);
});

console.log('Бот запущен и готов к работе...');