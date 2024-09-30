require('dotenv').config();
const express = require('express');
const tdl = require('tdl');
const { getTdjson } = require('prebuilt-tdlib');

tdl.configure({ tdjson: getTdjson() });

const app = express();
app.use(express.json());

const client = tdl.createClient({
  apiId: process.env.API_ID,
  apiHash: process.env.API_HASH,
});

client.on('error', console.error);
client.on('update', update => {
  console.log('Received update:', update);
});

async function loginTelegram() {
  try {
    await client.login();
    console.log('Logged in to Telegram');
  } catch (error) {
    console.error('Login failed:', error);
  }
}

// Ruta para iniciar sesión
app.post('/login', async (req, res) => {
  try {
    await loginTelegram();
    res.json({ message: 'Logged in to Telegram' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para obtener información del usuario
app.get('/me', async (req, res) => {
  try {
    const me = await client.invoke({ _: 'getMe' });
    res.json(me);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para obtener chats
app.get('/chats', async (req, res) => {
  try {
    const chats = await client.invoke({
      _: 'getChats',
      chat_list: { _: 'chatListMain' },
      limit: 2,
    });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para enviar un mensaje a un chat
app.post('/sendMessage', async (req, res) => {
  const { chatId, message } = req.body;

  try {
    const response = await client.invoke({
      _: 'sendMessage',
      chat_id: chatId,
      input_message_content: {
        _: 'inputMessageText',
        text: {
          _: 'formattedText',
          text: message,
        },
      },
    });
    res.json({ message: 'Message sent', response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para buscar chats por nombre en la lista de chats locales conocidos
app.get('/searchChats', async (req, res) => {
  const { query } = req.query;

  try {
    // Invoca el método searchChats con el query y un límite de resultados
    const searchResults = await client.invoke({
      _: 'searchChats',
      query: query || '',  // Si el query está vacío, trae los últimos 50 chats
      limit: 5,           // Número máximo de resultados
    });
    
    // Envía la respuesta JSON con los resultados
    res.json(searchResults);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Ruta para obtener detalles de un chat
app.get('/chat/:chatId', async (req, res) => {
  const chatId = parseInt(req.params.chatId);

  try {
    const chatInfo = await client.invoke({
      _: 'getChat',
      chat_id: chatId,
    });
    res.json(chatInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Ruta para iniciar cerrar sesión
app.post('/logout', async (req, res) => {
    try {
      await client.close();
      res.json({ message: 'Salimos de Telegram' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
