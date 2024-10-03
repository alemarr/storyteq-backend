export class TradeMessage {
  constructor(tradeTime, companyName, orderType, quantity) {
    this.tradeTime = tradeTime;
    this.companyName = companyName;
    this.orderType = orderType;
    this.quantity = quantity;
  }
}