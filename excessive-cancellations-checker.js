const fs = require("fs");

import { TradeMessage } from "./src/trade-message";
import { isExcessiveWithinInterval, isValidOrderType, isWithinInterval } from "./src/utils.js";

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

  async companiesInvolvedInExcessiveCancellations() {
    const companiesInvolvedInExcessiveCancellations = [];
    const tradeMessages = this.getTradeMessages();

    // Sort by company name
    tradeMessages.sort((trade, anotherTrade) => trade.companyName.localeCompare(anotherTrade.companyName));

    const companyTradeMessages = new Map([]);

    // Group messages by company name
    this.companies.forEach((companyName) => {
      const messages = tradeMessages.filter((message) => message.companyName === companyName);
      companyTradeMessages.set(companyName, messages);
    });

    // Iterate through the company's messages and split them in chunks of 1 minute intervals
    // to check if they are excessive
    companyTradeMessages.forEach((messages, companyName) => {
      const firstMessage = messages.shift();
      const start = new Date(firstMessage.tradeTime).getTime();

      let messagesInInterval = [firstMessage];

      for (let i = 0; i <= messages.length; i++) {
        const message = messages[i];
        if (message && isWithinInterval(start, message)) {
          messagesInInterval.push(message);
        } else {
          if (isExcessiveWithinInterval(messagesInInterval)) {
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
