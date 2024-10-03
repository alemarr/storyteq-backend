const fs = require("fs");

// Emulating an enum here
const OrderType = {
  NewOrder: "D",
  Cancellation: "F",
}

class TradeMessage {
  constructor(tradeTime, companyName, orderType, quantity) {
    this.tradeTime = tradeTime;
    this.companyName = companyName;
    this.orderType = orderType;
    this.quantity = quantity;
  }
}

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

      if (!this.isValidOrderType(orderType)) {
        return;
      }

      if (!this.companies.includes(companyName)) {
        this.companies.push(companyName);
      }

      tradeMessages.push(
          new TradeMessage(tradeTime, companyName, orderType, parseInt(quantity))
      );
    });

    return tradeMessages;
  }

  isValidOrderType(orderType) {
    return orderType === OrderType.NewOrder || orderType === OrderType.Cancellation;
  }

  async companiesInvolvedInExcessiveCancellations() {
    const tradeMessages = this.getTradeMessages();

    // Sort by company name
    tradeMessages.sort(
        (trade, anotherTrade) =>
            trade.companyName.localeCompare(anotherTrade.companyName)
    );

    const companiesInvolvedInExcessiveCancellations = [];

    const companyTradeMessages = new Map([]);

    this.companies.forEach((companyName) => {
      const messages = tradeMessages.filter((message) => message.companyName === companyName);
      companyTradeMessages.set(companyName, messages);
    });

    const INTERVAL_MILLISECONDS = 1000 * 60;
    const isWithinInterval = (start, message) => {
      return new Date(message.tradeTime).getTime() <= start + INTERVAL_MILLISECONDS;
    };

    const isExcessiveWithinInterval = (messages) => {
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

      return total / 3 < cancellations;
    };

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
