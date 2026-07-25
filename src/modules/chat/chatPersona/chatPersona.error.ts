export class ChatPersonaError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "ChatPersonaError";
  }
}
