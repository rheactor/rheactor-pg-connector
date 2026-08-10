// oxlint-disable-next-line unicorn/custom-error-definition
export class TransactionRollback<R> extends Error {
  public constructor(public readonly result?: R) {
    super();

    this.name = "TransactionRollback";
  }
}
