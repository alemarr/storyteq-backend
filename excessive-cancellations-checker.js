const fs = require("fs");

import { TradeMessage } from "./src/trade-message";
import { isValidOrderType } from "./src/utils";
import { INTERVAL_MILLISECONDS, MESSAGES_PORTION_TO_CHECK } from "./src/constants";
import { OrderType } from "./src/order-type";

export class ExcessiveCancellationsChecker {
  constructor(filePath) {
    this.filePath = filePath;
    this.companies = [];
  }

  getTradeMessages() {
    const data = fs.readFileSync(this.filePath).toLocaleString();

    const rows = data.split("\n");

    const tradeMessages = [];
    rows.forEach((row) => {
      const [tradeTime, companyName, orderType, quantity] = row.split(",");

      if (!tradeTime || !companyName || !orderType || !quantity) {
        return;
      }

      if (!isValidOrderType(orderType)) {
        return;
      }

      if (!this.companies.includes(companyName)) {
        this.companies.push(companyName);
      }

      tradeMessages.push(new TradeMessage(tradeTime, companyName, orderType, parseInt(quantity)));
    });

    return tradeMessages;
  }

  checkMessagesInInterval(messages) {
    const total = messages.reduce((sum, message) => {
      sum += message.quantity;
      return sum;
    }, 0);
    const cancellations = messages.reduce((sum, message) => {
      if (message.orderType === OrderType.Cancellation) {
        sum += message.quantity;
      }
      return sum;
    }, 0);

    return total / MESSAGES_PORTION_TO_CHECK < cancellations;
  }

  isMessageWithinInterval = (startOfInterval, message) => {
    return new Date(message.tradeTime).getTime() <= startOfInterval + INTERVAL_MILLISECONDS;
  };

  async companiesInvolvedInExcessiveCancellations() {
    const companiesInvolvedInExcessiveCancellations = [];
    const tradeMessages = this.getTradeMessages();

    // Sort messages by company name to group them later
    tradeMessages.sort((trade, anotherTrade) => trade.companyName.localeCompare(anotherTrade.companyName));

    const companyTradeMessages = new Map([]);

    // Group messages by company name to check each company once
    this.companies.forEach((companyName) => {
      const messages = tradeMessages.filter((message) => message.companyName === companyName);
      companyTradeMessages.set(companyName, messages);
    });

    // Iterate through the company's messages and split them in chunks of 1 minute intervals
    // to check if they are excessive
    companyTradeMessages.forEach((messages, companyName) => {
      const firstMessage = messages.shift();
      const startOfInterval = new Date(firstMessage.tradeTime).getTime();

      let messagesInInterval = [firstMessage];

      for (let i = 0; i <= messages.length; i++) {
        const message = messages[i];
        // Add message to interval
        if (message && this.isMessageWithinInterval(startOfInterval, message)) {
          messagesInInterval.push(message);
        } else {
          // Check messages in interval
          if (this.checkMessagesInInterval(messagesInInterval)) {
            companiesInvolvedInExcessiveCancellations.push(companyName);
            break;
          }
          messagesInInterval = []
        }
      }
    })

    return companiesInvolvedInExcessiveCancellations;
  }

  async totalNumberOfWellBehavedCompanies() {
    const companiesInvolvedInExcessiveCancellations = await this.companiesInvolvedInExcessiveCancellations();
    return this.companies.filter((company) => !companiesInvolvedInExcessiveCancellations.includes(company)).length;
  }
}
