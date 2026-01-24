import TelegramBot from 'node-telegram-bot-api';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import User from '../models/User.model';
import { generateReferralCode } from '../utils/referral';

dotenv.config();

let bot: TelegramBot;

export function initializeBot(io: Server) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set');
  }

  bot = new TelegramBot(token, { polling: true });

  // Store pending transfers (simple in-memory store) - defined early so all handlers can access it
  const pendingTransfers = new Map<number, { receiverReferralCode: string; receiverId: string }>();

  // Welcome message with inline keyboard
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const welcomeText = 'Welcome to Trial Bingo! 🎮';
    
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📝 Register', callback_data: 'register' }],
          [{ text: '🎮 Play', callback_data: 'play' }],
          [{ text: '💰 Deposit', callback_data: 'deposit' }],
          [{ text: '📢 Join Channel', url: 'https://t.me/your_channel' }],
          [{ text: '💸 Withdraw', callback_data: 'withdraw' }],
          [{ text: '🔄 Transfer', callback_data: 'transfer' }],
        ],
      },
    };

    // Send logo image if available, otherwise just text
    try {
      // Get the image path relative to the backend root
      const imagePath = path.join(__dirname, '../../asset/Gemini_Generated_Image_pqmjpgpqmjpgpqmj.png');
      await bot.sendPhoto(chatId, imagePath, {
        caption: welcomeText,
        ...keyboard,
      });
    } catch (error) {
      await bot.sendMessage(chatId, welcomeText, keyboard);
    }
  });

  // Register command
  bot.onText(/\/register/, async (msg) => {
    const chatId = msg.chat.id;
    const text = 'Please share your contact information to register.';
    
    const keyboard = {
      reply_markup: {
        keyboard: [
          [
            {
              text: '📱 Share Contact',
              request_contact: true,
            },
          ],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    };

    await bot.sendMessage(chatId, text, keyboard);
  });

  // Handle contact sharing
  bot.on('contact', async (msg) => {
    const chatId = msg.chat.id;
    const contact = msg.contact;

    if (!contact) {
      return;
    }

    try {
      // Check if user already exists
      const existingUser = await User.findOne({ telegramId: chatId });
      if (existingUser) {
        await bot.sendMessage(
          chatId,
          '❌ You are already registered! Please use /play to start playing.'
        );
        return;
      }

      // Normalize phone number (remove + prefix if present, keep it consistent)
      const phoneNumber = contact.phone_number?.startsWith('+') 
        ? contact.phone_number 
        : `+${contact.phone_number}`;

      // Check if phone number already exists
      const existingPhoneUser = await User.findOne({ phone: phoneNumber });
      if (existingPhoneUser) {
        await bot.sendMessage(
          chatId,
          '❌ This phone number is already registered with another account.'
        );
        return;
      }

      // Create new user
      const referralCode = await generateReferralCode();
      const user = new User({
        telegramId: chatId,
        firstName: contact.first_name || 'User',
        lastName: contact.last_name,
        phone: phoneNumber,
        balance: 5,
        demoGames: 3,
        referralCode,
      });

      await user.save();
      console.log(`✅ User registered successfully: ${user.telegramId} - ${user.firstName} (${user.phone})`);

      const successMessage =
        '✅ Registration successful!\n\n' +
        `Name: ${user.firstName}\n` +
        `Phone: ${user.phone}\n` +
        `Balance: ${user.balance}\n` +
        `Demo Games: ${user.demoGames}\n` +
        `Referral Code: ${user.referralCode}`;

      await bot.sendMessage(chatId, successMessage);
    } catch (error: any) {
      console.error('Registration error details:', {
        error: error.message,
        stack: error.stack,
        code: error.code,
        keyPattern: error.keyPattern,
        keyValue: error.keyValue,
        chatId,
        contact: contact ? {
          phone: contact.phone_number,
          firstName: contact.first_name,
        } : null,
      });

      let errorMessage = '❌ Registration failed. Please try again.';
      
      // Provide more specific error messages
      if (error.code === 11000) {
        // Duplicate key error
        if (error.keyPattern?.telegramId) {
          errorMessage = '❌ This Telegram account is already registered.';
        } else if (error.keyPattern?.phone) {
          errorMessage = '❌ This phone number is already registered.';
        } else if (error.keyPattern?.referralCode) {
          errorMessage = '❌ Referral code conflict. Please try again.';
        } else if (error.keyPattern?.email) {
          // Email index issue - try to drop it and retry
          console.log('⚠️  Email index conflict detected, attempting to fix...');
          try {
            if (mongoose.connection.db) {
              await mongoose.connection.db.collection('users').dropIndex('email_1');
              console.log('✅ Dropped email index, user should retry registration');
              errorMessage = '❌ Registration failed due to database issue. Please try again in a moment.';
            } else {
              errorMessage = '❌ Registration failed. Please contact support.';
            }
          } catch (dropError) {
            errorMessage = '❌ Registration failed. Please contact support.';
          }
        }
      } else if (error.name === 'ValidationError') {
        errorMessage = `❌ Validation error: ${Object.values(error.errors).map((e: any) => e.message).join(', ')}`;
      }

      await bot.sendMessage(chatId, errorMessage);
    }
  });

  // Deposit command
  bot.onText(/\/deposit/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const user = await User.findOne({ telegramId: chatId });
      if (!user) {
        await bot.sendMessage(chatId, '❌ Please register first using /register');
        return;
      }

      // Send payment option selection
      const paymentMessage = 'እባክዎ የሚጠቀሙትን የክፍያ እማራጭ ይምረጡ (Telebirr ወይም Commercial Bank of Ethiopia)';
      
      const paymentKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '📱 Telebirr',
                callback_data: 'deposit_telebirr',
              },
              {
                text: '🏦 CBE',
                callback_data: 'deposit_cbe',
              },
            ],
          ],
        },
      };

      await bot.sendMessage(chatId, paymentMessage, paymentKeyboard);
    } catch (error) {
      console.error('Deposit command error:', error);
      await bot.sendMessage(chatId, '❌ Error processing deposit request. Please try again.');
    }
  });

  // Withdraw command
  bot.onText(/\/withdraw/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const user = await User.findOne({ telegramId: chatId });
      if (!user) {
        await bot.sendMessage(chatId, '❌ Please register first using /register');
        return;
      }

      // Step 1: Show balance and ask for withdrawal amount
      await bot.sendMessage(
        chatId,
        `💰 የእርስዎ የአሁኑ ሂሳብ: ${user.balance} Birr\n\nእባክዎ ምን ያህል መልሶ ማውጣት ይፈልጋሉ?`,
        {
          reply_markup: {
            force_reply: true,
            input_field_placeholder: 'Enter amount to withdraw (e.g., 100)',
          },
        }
      );
    } catch (error) {
      console.error('Withdraw command error:', error);
      await bot.sendMessage(chatId, '❌ Error processing withdraw request. Please try again.');
    }
  });

  // Transfer command
  bot.onText(/\/transfer/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const user = await User.findOne({ telegramId: chatId });
      if (!user) {
        await bot.sendMessage(chatId, '❌ Please register first using /register');
        return;
      }

      // Step 1: Ask for referral code to transfer to
      await bot.sendMessage(
        chatId,
        `💰 የእርስዎ የአሁኑ ሂሳብ: ${user.balance} Birr\n\nእባክዎ ለማስተላለፍ የሚፈልጉትን የተጠቃሚ Referral Code ያስገቡ:`,
        {
          reply_markup: {
            force_reply: true,
            input_field_placeholder: 'Enter Referral Code (e.g., 813d03b6)',
          },
        }
      );
    } catch (error) {
      console.error('Transfer command error:', error);
      await bot.sendMessage(chatId, '❌ Error processing transfer request. Please try again.');
    }
  });

  // Cancel command - resets bot to initial state (can be used at any time)
  bot.onText(/\/cancel/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      // Clear any pending transfers
      pendingTransfers.delete(chatId);

      const welcomeText = 'Welcome to Trial Bingo! 🎮';
      
      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📝 Register', callback_data: 'register' }],
            [{ text: '🎮 Play', callback_data: 'play' }],
            [{ text: '💰 Deposit', callback_data: 'deposit' }],
            [{ text: '📢 Join Channel', url: 'https://t.me/your_channel' }],
            [{ text: '💸 Withdraw', callback_data: 'withdraw' }],
            [{ text: '🔄 Transfer', callback_data: 'transfer' }],
          ],
        },
      };

      // Send logo image if available, otherwise just text
      try {
        const imagePath = path.join(__dirname, '../../asset/Gemini_Generated_Image_pqmjpgpqmjpgpqmj.png');
        await bot.sendPhoto(chatId, imagePath, {
          caption: welcomeText,
          ...keyboard,
        });
      } catch (error) {
        await bot.sendMessage(chatId, welcomeText, keyboard);
      }

      await bot.sendMessage(chatId, '✅ Operation cancelled. You can start fresh!');
    } catch (error) {
      console.error('Cancel command error:', error);
      await bot.sendMessage(chatId, '❌ Error processing cancel request. Please try again.');
    }
  });

  // Play command
  bot.onText(/\/play/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const user = await User.findOne({ telegramId: chatId });
      if (!user) {
        await bot.sendMessage(
          chatId,
          '❌ Please register first using /register'
        );
        return;
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const gameUrl = `${frontendUrl}?userId=${user._id.toString()}&token=${encodeURIComponent(chatId.toString())}`;

      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🎮 Open the Game',
                web_app: { url: gameUrl },
              },
            ],
          ],
        },
      };

      // Send game image with button
      try {
        await bot.sendPhoto(chatId, 'path/to/game-image.png', {
          caption: '🎮 Choose your game mode!',
          ...keyboard,
        });
      } catch (error) {
        await bot.sendMessage(chatId, '🎮 Choose your game mode!', keyboard);
      }
    } catch (error) {
      console.error('Play error:', error);
      await bot.sendMessage(chatId, '❌ Error opening game. Please try again.');
    }
  });

  // Handle callback queries (button presses)
  bot.on('callback_query', async (query) => {
    const chatId = query.message?.chat.id;
    const data = query.data;

    if (!chatId) return;

    try {
      switch (data) {
        case 'register':
          await bot.answerCallbackQuery(query.id);
          await bot.sendMessage(chatId, 'Please share your contact information to register.', {
            reply_markup: {
              keyboard: [
                [
                  {
                    text: '📱 Share Contact',
                    request_contact: true,
                  },
                ],
              ],
              resize_keyboard: true,
              one_time_keyboard: true,
            },
          });
          break;

        case 'play':
          await bot.answerCallbackQuery(query.id);
          const user = await User.findOne({ telegramId: chatId });
          if (!user) {
            await bot.sendMessage(chatId, '❌ Please register first using /register');
            return;
          }

          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
          const gameUrl = `${frontendUrl}?userId=${user._id.toString()}&token=${encodeURIComponent(chatId.toString())}`;

          await bot.sendMessage(chatId, '🎮 Choose your game mode!', {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🎮 Open the Game',
                    web_app: { url: gameUrl },
                  },
                ],
              ],
            },
          });
          break;

        case 'deposit':
          await bot.answerCallbackQuery(query.id);
          const depositUser = await User.findOne({ telegramId: chatId });
          if (!depositUser) {
            await bot.sendMessage(chatId, '❌ Please register first using /register');
            return;
          }

          // Send payment option selection
          const paymentMessage = 'እባክዎ የሚጠቀሙትን የክፍያ እማራጭ ይምረጡ (Telebirr ወይም Commercial Bank of Ethiopia)';
          
          const paymentKeyboard = {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '📱 Telebirr',
                    callback_data: 'deposit_telebirr',
                  },
                  {
                    text: '🏦 CBE',
                    callback_data: 'deposit_cbe',
                  },
                ],
              ],
            },
          };

          await bot.sendMessage(chatId, paymentMessage, paymentKeyboard);
          break;

        case 'deposit_telebirr':
          await bot.answerCallbackQuery(query.id);
          
          // Send account details and instructions for Telebirr
          const telebirrDetails = `📅 እባክዎ የደረሶትን Transaction ID ያስገቡ

(Example:- Telebirr: CDF8QQMTVE)

📱 ወደ ቴሌብር ለማስገባት: 0978280042

👉 ቁጥሮቹን Copy ለማድረግ እባኮትን የፅሁፍ አካላቸውን ያጫኑ።

ከፍተኛ ማስገባት የሚቻለው = 1000 Birr
ትንሹ ማስገባት ሚቻለው = 50 Birr

📱 እባክዎ የቴሌብር Transaction ID ያስገቡ:`;
          
          await bot.sendMessage(chatId, telebirrDetails, {
            reply_markup: {
              force_reply: true,
              input_field_placeholder: 'Enter Telebirr Transaction ID',
            },
          });
          break;

        case 'deposit_cbe':
          await bot.answerCallbackQuery(query.id);
          
          // Send account details and instructions for CBE
          const cbeDetails = `📅 እባክዎ የደረሶትን Transaction ID ያስገቡ

(Example:- CBE(Bank): FT25106S48WP)

💵 ወደ ንግድ ባንክ ለማስገባት: 1000686060504

👉 ቁጥሮቹን Copy ለማድረግ እባኮትን የፅሁፍ አካላቸውን ያጫኑ።

ከፍተኛ ማስገባት የሚቻለው = 1000 Birr
ትንሹ ማስገባት ሚቻለው = 50 Birr

🏦 እባክዎ የCBE Transaction ID ያስገቡ:`;
          
          await bot.sendMessage(chatId, cbeDetails, {
            reply_markup: {
              force_reply: true,
              input_field_placeholder: 'Enter CBE Transaction ID',
            },
          });
          break;

        case 'withdraw':
          await bot.answerCallbackQuery(query.id);
          const withdrawUser = await User.findOne({ telegramId: chatId });
          if (!withdrawUser) {
            await bot.sendMessage(chatId, '❌ Please register first using /register');
            return;
          }

          // Step 1: Show balance and ask for withdrawal amount
          await bot.sendMessage(
            chatId,
            `💰 የእርስዎ የአሁኑ ሂሳብ: ${withdrawUser.balance} Birr\n\nእባክዎ ምን ያህል መልሶ ማውጣት ይፈልጋሉ?`,
            {
              reply_markup: {
                force_reply: true,
                input_field_placeholder: 'Enter amount to withdraw (e.g., 100)',
              },
            }
          );
          break;

        case 'transfer':
          await bot.answerCallbackQuery(query.id);
          const transferUser = await User.findOne({ telegramId: chatId });
          if (!transferUser) {
            await bot.sendMessage(chatId, '❌ Please register first using /register');
            return;
          }

          // Step 1: Ask for referral code to transfer to
          await bot.sendMessage(
            chatId,
            `💰 የእርስዎ የአሁኑ ሂሳብ: ${transferUser.balance} Birr\n\nእባክዎ ለማስተላለፍ የሚፈልጉትን የተጠቃሚ Referral Code ያስገቡ:`,
            {
              reply_markup: {
                force_reply: true,
                input_field_placeholder: 'Enter Referral Code (e.g., 813d03b6)',
              },
            }
          );
          break;

        default:
          await bot.answerCallbackQuery(query.id);
      }
    } catch (error) {
      console.error('Callback query error:', error);
      await bot.answerCallbackQuery(query.id, { text: '❌ Error processing request' });
    }
  });

  // Handle deposit transaction IDs (reply to force_reply messages)
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const replyToMessage = msg.reply_to_message;

    // Skip if it's a command or not a reply
    if (!text || !replyToMessage || text.startsWith('/')) {
      return;
    }

    const replyText = replyToMessage.text || '';
    
    // Check if it's a Telebirr transaction ID prompt
    if (replyText.includes('ቴሌብር Transaction ID') || replyText.includes('Telebirr Transaction ID')) {
      try {
        const user = await User.findOne({ telegramId: chatId });
        if (!user) {
          await bot.sendMessage(chatId, '❌ User not found. Please register first.');
          return;
        }

        // Validate transaction ID format (alphanumeric, 6-20 characters)
        const transactionId = text.trim();
        if (!/^[A-Z0-9]{6,20}$/i.test(transactionId)) {
          await bot.sendMessage(
            chatId,
            '❌ Invalid Transaction ID format. Please enter a valid Telebirr Transaction ID.\n\n(Example: CDF8QQMTVE)'
          );
          return;
        }

        // Store deposit request (you can create a Deposit model later)
        console.log(`📱 Telebirr deposit request: User ${user.telegramId}, Transaction ID: ${transactionId}`);
        
        await bot.sendMessage(
          chatId,
          `✅ የቴሌብር Transaction ID ተቀብሏል!\n\nTransaction ID: ${transactionId}\n\nእባክዎ ይጠብቁ... የእርስዎ ክፍያ እየተፈተሸ ነው።\n\nየክፍያዎ ከተፈተሸ በኋላ ወደ ሂሳብዎ ይጨመራል።`
        );
      } catch (error) {
        console.error('Telebirr deposit error:', error);
        await bot.sendMessage(chatId, '❌ Error processing deposit. Please try again.');
      }
      return;
    }

    // Check if it's a CBE transaction ID prompt
    if (replyText.includes('CBE Transaction ID') || replyText.includes('ንግድ ባንክ')) {
      try {
        const user = await User.findOne({ telegramId: chatId });
        if (!user) {
          await bot.sendMessage(chatId, '❌ User not found. Please register first.');
          return;
        }

        // Validate transaction ID format (alphanumeric, 6-20 characters)
        const transactionId = text.trim();
        if (!/^[A-Z0-9]{6,20}$/i.test(transactionId)) {
          await bot.sendMessage(
            chatId,
            '❌ Invalid Transaction ID format. Please enter a valid CBE Transaction ID.\n\n(Example: FT25106S48WP)'
          );
          return;
        }

        // Store deposit request
        console.log(`🏦 CBE deposit request: User ${user.telegramId}, Transaction ID: ${transactionId}`);
        
        await bot.sendMessage(
          chatId,
          `✅ የCBE Transaction ID ተቀብሏል!\n\nTransaction ID: ${transactionId}\n\nእባክዎ ይጠብቁ... የእርስዎ ክፍያ እየተፈተሸ ነው።\n\nየክፍያዎ ከተፈተሸ በኋላ ወደ ሂሳብዎ ይጨመራል።`
        );
      } catch (error) {
        console.error('CBE deposit error:', error);
        await bot.sendMessage(chatId, '❌ Error processing deposit. Please try again.');
      }
      return;
    }

    // Check if it's a withdraw amount prompt
    if (replyText.includes('ምን ያህል ማውጣት') || replyText.includes('withdrawal amount') || replyText.includes('withdraw')) {
      try {
        const user = await User.findOne({ telegramId: chatId });
        if (!user) {
          await bot.sendMessage(chatId, '❌ User not found. Please register first.');
          return;
        }

        // Validate and parse amount
        const amount = parseFloat(text.trim());
        if (isNaN(amount) || amount <= 0) {
          await bot.sendMessage(chatId, '❌ Invalid amount. Please enter a valid number greater than 0.');
          return;
        }

        // Check balance
        if (user.balance < amount) {
          await bot.sendMessage(
            chatId,
            `❌ Insufficient balance!\n\nYour current balance: ${user.balance} Birr\nRequested amount: ${amount} Birr`
          );
          return;
        }

        // Deduct balance
        user.balance -= amount;
        await user.save();

        console.log(`💸 Withdrawal: User ${user.telegramId} withdrew ${amount} Birr. New balance: ${user.balance}`);

        await bot.sendMessage(
          chatId,
          `✅ Withdrawal successful!\n\nAmount withdrawn: ${amount} Birr\nNew balance: ${user.balance} Birr\n\nእባክዎ ይጠብቁ... የእርስዎ ክፍያ እየተላከ ነው።`
        );
      } catch (error) {
        console.error('Withdraw error:', error);
        await bot.sendMessage(chatId, '❌ Error processing withdrawal. Please try again.');
      }
      return;
    }

  });

  // Enhanced message handler for withdraw and transfer flows
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const replyToMessage = msg.reply_to_message;

    // Skip if it's a command or not a reply
    if (!text || !replyToMessage || text.startsWith('/')) {
      return;
    }

    const replyText = replyToMessage.text || '';

    // Handle withdraw amount entry
    if (replyText.includes('ምን ያህል መልሶ ማውጣት') || replyText.includes('withdrawal amount') || (replyText.includes('withdraw') && replyText.includes('balance'))) {
      try {
        const user = await User.findOne({ telegramId: chatId });
        if (!user) {
          await bot.sendMessage(chatId, '❌ User not found. Please register first.');
          return;
        }

        // Validate and parse amount
        const amount = parseFloat(text.trim());
        if (isNaN(amount) || amount <= 0) {
          await bot.sendMessage(chatId, '❌ Invalid amount. Please enter a valid number greater than 0.');
          return;
        }

        // Check balance
        if (user.balance < amount) {
          await bot.sendMessage(
            chatId,
            `❌ Insufficient balance!\n\nYour current balance: ${user.balance} Birr\nRequested amount: ${amount} Birr`
          );
          return;
        }

        // Deduct balance
        user.balance -= amount;
        await user.save();

        console.log(`💸 Withdrawal: User ${user.telegramId} withdrew ${amount} Birr. New balance: ${user.balance}`);

        await bot.sendMessage(
          chatId,
          `✅ Withdrawal successful!\n\nAmount withdrawn: ${amount} Birr\nNew balance: ${user.balance} Birr\n\nእባክዎ ይጠብቁ... የእርስዎ ክፍያ እየተላከ ነው።`
        );
      } catch (error) {
        console.error('Withdraw error:', error);
        await bot.sendMessage(chatId, '❌ Error processing withdrawal. Please try again.');
      }
      return;
    }

    // Handle transfer referral code entry
    if (replyText.includes('Referral Code') && replyText.includes('ማስተላለፍ')) {
      try {
        const sender = await User.findOne({ telegramId: chatId });
        if (!sender) {
          await bot.sendMessage(chatId, '❌ User not found. Please register first.');
          return;
        }

        const referralCode = text.trim();
        
        // Check if user exists with this referral code
        const receiver = await User.findOne({ referralCode: referralCode });
        if (!receiver) {
          await bot.sendMessage(
            chatId,
            `❌ User not found!\n\nReferral Code "${referralCode}" does not exist. Please check and try again.`
          );
          return;
        }

        // Check if trying to transfer to self
        if (receiver.telegramId === sender.telegramId) {
          await bot.sendMessage(chatId, '❌ You cannot transfer to yourself!');
          return;
        }

        // Store pending transfer
        pendingTransfers.set(chatId, {
          receiverReferralCode: referralCode,
          receiverId: receiver._id.toString(),
        });

        await bot.sendMessage(
          chatId,
          `✅ User found!\n\nReceiver: ${receiver.firstName}\nPhone: ${receiver.phone}\n\nእባክዎ ምን ያህል መላል ይፈልጋሉ?\n\nYour balance: ${sender.balance} Birr`,
          {
            reply_markup: {
              force_reply: true,
              input_field_placeholder: `Enter amount to transfer`,
            },
          }
        );
      } catch (error) {
        console.error('Transfer user lookup error:', error);
        await bot.sendMessage(chatId, '❌ Error finding user. Please try again.');
      }
      return;
    }

    // Handle transfer amount entry
    if (replyText.includes('ምን ያህል መላል') && (replyText.includes('Receiver') || replyText.includes('balance'))) {
      try {
        const sender = await User.findOne({ telegramId: chatId });
        if (!sender) {
          await bot.sendMessage(chatId, '❌ User not found. Please register first.');
          return;
        }

        const pendingTransfer = pendingTransfers.get(chatId);
        if (!pendingTransfer) {
          await bot.sendMessage(chatId, '❌ Transfer session expired. Please start over.');
          return;
        }

        // Validate and parse amount
        const amount = parseFloat(text.trim());
        if (isNaN(amount) || amount <= 0) {
          await bot.sendMessage(chatId, '❌ Invalid amount. Please enter a valid number greater than 0.');
          return;
        }

        // Check balance
        if (sender.balance < amount) {
          await bot.sendMessage(
            chatId,
            `❌ Insufficient balance!\n\nYour current balance: ${sender.balance} Birr\nRequested amount: ${amount} Birr`
          );
          pendingTransfers.delete(chatId);
          return;
        }

        // Get receiver
        const receiver = await User.findById(pendingTransfer.receiverId);
        if (!receiver) {
          await bot.sendMessage(chatId, '❌ Receiver not found. Please try again.');
          pendingTransfers.delete(chatId);
          return;
        }

        // Perform transfer
        sender.balance -= amount;
        receiver.balance += amount;
        await sender.save();
        await receiver.save();

        pendingTransfers.delete(chatId);

        console.log(`🔄 Transfer: ${sender.telegramId} → ${receiver.telegramId}, Amount: ${amount} Birr`);

        await bot.sendMessage(
          chatId,
          `✅ Transfer successful!\n\nAmount: ${amount} Birr\nTo: ${receiver.firstName}\nYour new balance: ${sender.balance} Birr`
        );

        // Notify receiver
        try {
          await bot.sendMessage(
            receiver.telegramId,
            `💰 You received a transfer!\n\nAmount: ${amount} Birr\nFrom: ${sender.firstName}\nYour new balance: ${receiver.balance} Birr`
          );
        } catch (error) {
          console.error('Error notifying receiver:', error);
        }
      } catch (error) {
        console.error('Transfer error:', error);
        await bot.sendMessage(chatId, '❌ Error processing transfer. Please try again.');
        pendingTransfers.delete(chatId);
      }
      return;
    }
  });

  console.log('✅ Telegram bot initialized');
  return bot;
}

export function getBot(): TelegramBot {
  if (!bot) {
    throw new Error('Bot not initialized');
  }
  return bot;
}

