import TelegramBot from 'node-telegram-bot-api';
import { findUserByTelegramId } from '../services/userService';
import { createWithdraw } from '../services/walletService';
import { withdrawService } from '../services/withdrawService';
import { getForceReplyKeyboard, getWithdrawAccountTypeKeyboard } from '../utils/keyboards';
import { MESSAGES } from '../utils/messages';
import { validateWithdrawAmount, validateAccountNumber } from '../utils/validators';

export function setupWithdrawHandler(bot: TelegramBot) {
  // Withdraw command - match exactly /withdraw (not /withdrawal_history)
  bot.onText(/^\/withdraw$/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const user = await findUserByTelegramId(chatId);
      if (!user) {
        await bot.sendMessage(chatId, MESSAGES.NOT_REGISTERED);
        return;
      }

      await bot.sendMessage(
        chatId,
        MESSAGES.WITHDRAW_BALANCE_PROMPT(user.balance),
        getForceReplyKeyboard('Enter amount to withdraw (minimum 50 Birr)')
      );
    } catch (error) {
      console.error('Withdraw command error:', error);
      await bot.sendMessage(chatId, MESSAGES.ERROR_WITHDRAW);
    }
  });

  // Handle withdraw amount (Step 1)
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const replyToMessage = msg.reply_to_message;

    if (!text || !replyToMessage || text.startsWith('/')) {
      return;
    }

    const replyText = replyToMessage.text || '';
    
    // Check if this is a reply to the withdrawal amount prompt
    if (replyText.includes('ምን ያህል') && replyText.includes('ማውጣት') || 
        replyText.includes('withdrawal amount') || 
        (replyText.includes('withdraw') && replyText.includes('balance'))) {
      
      // Check if there's already a pending withdrawal (shouldn't be at this stage, but check anyway)
      const pendingWithdraw = withdrawService.getPendingWithdraw(chatId);
      if (pendingWithdraw && pendingWithdraw.amount > 0) {
        // Already processing, ignore
        return;
      }
      
      let user: any = null;
      let amount: number | undefined = undefined;
      
      try {
        user = await findUserByTelegramId(chatId);
        if (!user) {
          await bot.sendMessage(chatId, MESSAGES.USER_NOT_FOUND);
          return;
        }

        // Validate withdrawal amount (min 50, remaining >= 10)
        const amountValidation = validateWithdrawAmount(text, user.balance);
        if (!amountValidation.valid) {
          await bot.sendMessage(chatId, amountValidation.error || MESSAGES.INVALID_AMOUNT);
          return;
        }

        amount = amountValidation.value!;

        // Store pending withdrawal with amount
        withdrawService.setPendingWithdraw(chatId, {
          amount,
        });

        // Ask for account type (Step 2)
        await bot.sendMessage(
          chatId,
          MESSAGES.WITHDRAW_ACCOUNT_TYPE_PROMPT(amount),
          getWithdrawAccountTypeKeyboard()
        );
      } catch (error: any) {
        console.error('Withdraw amount error:', error);
        withdrawService.clearPendingWithdraw(chatId);
        await bot.sendMessage(chatId, MESSAGES.ERROR_WITHDRAW);
      }
      return;
    }

    // Handle account number (Step 3)
    const pendingWithdraw = withdrawService.getPendingWithdraw(chatId);
    if (pendingWithdraw && pendingWithdraw.amount > 0 && pendingWithdraw.accountType && !pendingWithdraw.accountNumber) {
      // Check if this is a reply to the account number prompt
      const replyText = (replyToMessage?.text || '').toLowerCase();
      if (replyText.includes('account number') || replyText.includes('account') || replyText.includes('ያስገቡ')) {
        try {
          // Validate account number
          const accountValidation = validateAccountNumber(text);
          if (!accountValidation.valid) {
            await bot.sendMessage(chatId, accountValidation.error || MESSAGES.INVALID_ACCOUNT_NUMBER);
            return;
          }

          const accountNumber = text.trim();

          // Get user to get userId
          const user = await findUserByTelegramId(chatId);
          if (!user) {
            await bot.sendMessage(chatId, MESSAGES.USER_NOT_FOUND);
            withdrawService.clearPendingWithdraw(chatId);
            return;
          }

          // Create withdrawal via API
          const result = await createWithdraw(
            user._id,
            pendingWithdraw.amount,
            accountNumber,
            pendingWithdraw.accountType
          );
          
          console.log(`💸 Withdrawal: User ${chatId} withdrew ${pendingWithdraw.amount} Birr to ${pendingWithdraw.accountType} ${accountNumber}. New balance: ${result.newBalance}`);

          await bot.sendMessage(chatId, MESSAGES.WITHDRAW_SUCCESS(pendingWithdraw.amount, result.newBalance));
          
          // Clear pending withdrawal
          withdrawService.clearPendingWithdraw(chatId);
        } catch (error: any) {
          console.error('Withdraw error:', error);
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            amount: pendingWithdraw.amount,
            accountType: pendingWithdraw.accountType,
            chatId,
          });
          
          const errorMsg = error.message?.toLowerCase() || '';
          let errorMessage = MESSAGES.ERROR_WITHDRAW;
          
          if (errorMsg.includes('insufficient balance') || errorMsg.includes('insufficient')) {
            errorMessage = MESSAGES.INSUFFICIENT_BALANCE(0, 0);
          } else if (errorMsg.includes('invalid amount')) {
            errorMessage = MESSAGES.INVALID_AMOUNT;
          } else if (errorMsg.includes('account_type') || errorMsg.includes('account_number')) {
            errorMessage = MESSAGES.INVALID_ACCOUNT_NUMBER;
          } else if (errorMsg.includes('check constraint') || errorMsg.includes('transaction_type')) {
            errorMessage = '❌ Withdrawal failed due to a server error. Please contact support.';
            console.error('⚠️ Database constraint violation detected. This is likely an issue with the external API backend.');
          }
          
          await bot.sendMessage(chatId, errorMessage);
          withdrawService.clearPendingWithdraw(chatId);
        }
        return;
      }
    }
  });
}
