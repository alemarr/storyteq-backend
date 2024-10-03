import { ExcessiveCancellationsChecker } from '../excessive-cancellations-checker.js'

const checker = new ExcessiveCancellationsChecker('./data/trades.csv');

describe("Well Behaved Companies", () => {
  it("gets the amount of companies that are not involved in excessive cancelling", async () => {
    const totalWellBehavedCompanies = await checker.totalNumberOfWellBehavedCompanies();
    expect(totalWellBehavedCompanies).toBe(12);
  });
});