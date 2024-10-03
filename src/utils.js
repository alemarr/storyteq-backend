import { OrderType } from "./order-type.js";

export const isValidOrderType = (orderType) => {
  return orderType === OrderType.NewOrder || orderType === OrderType.Cancellation;
}

const INTERVAL_MILLISECONDS = 1000 * 60;
export const isWithinInterval = (start, message) => {
  return new Date(message.tradeTime).getTime() <= start + INTERVAL_MILLISECONDS;
};

export const isExcessiveWithinInterval = (messages) => {
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