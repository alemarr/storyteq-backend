import { OrderType } from "./order-type";

export const isValidOrderType = (orderType) => {
  return orderType === OrderType.NewOrder || orderType === OrderType.Cancellation;
}