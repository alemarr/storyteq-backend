import { ExcessiveCancellationsChecker } from '../excessive-cancellations-checker.js'

const checker = new ExcessiveCancellationsChecker('./data/trades_second_test.csv');

describe("Excessive Cancellations Test: Confirmation", () => {

    describe("calculate", () => {

        it("confirms that the solution works", async () => {
            const companiesList = await checker.companiesInvolvedInExcessiveCancellations();
            expect(companiesList).toEqual(["The financial incompetents"]);
        });

    });

});
