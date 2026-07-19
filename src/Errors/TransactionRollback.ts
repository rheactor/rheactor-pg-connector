export class TransactionRollback<R> extends Error {
  public constructor(public readonly result?: R) {
    super();
  }
}
