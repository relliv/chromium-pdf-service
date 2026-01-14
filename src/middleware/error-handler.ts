import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export function errorHandler(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply
): void {
  // Log the error
  reply.log.error(error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    reply.status(400).send({
      error: 'Validation failed',
      details: error.issues,
    });
    return;
  }

  // Handle specific error codes
  if (error.code === 'FST_ERR_VALIDATION') {
    reply.status(400).send({
      error: 'Validation failed',
      message: error.message,
    });
    return;
  }

  if (error.code === 'FST_ERR_NOT_FOUND') {
    reply.status(404).send({
      error: 'Not found',
      message: error.message,
    });
    return;
  }

  // Handle multipart errors
  if (error.code === 'FST_REQ_FILE_TOO_LARGE') {
    reply.status(413).send({
      error: 'File too large',
      message: 'The uploaded file exceeds the maximum allowed size',
    });
    return;
  }

  // Generic error response
  const statusCode = error.statusCode ?? 500;
  const message = statusCode === 500 ? 'Internal server error' : error.message;

  reply.status(statusCode).send({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
}
