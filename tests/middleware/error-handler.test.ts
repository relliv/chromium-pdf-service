import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { errorHandler } from '../../src/middleware/error-handler.js';

describe('Error Handler', () => {
  let mockReply: FastifyReply;
  let mockRequest: FastifyRequest;

  beforeEach(() => {
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      log: {
        error: vi.fn(),
      },
    } as unknown as FastifyReply;

    mockRequest = {} as FastifyRequest;
  });

  it('should handle Zod validation errors', () => {
    const zodError = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: ['requestedKey'],
        message: 'Expected string, received number',
      },
    ]);

    errorHandler(zodError as unknown as FastifyError, mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith({
      error: 'Validation failed',
      details: zodError.issues,
    });
  });

  it('should handle FST_ERR_VALIDATION errors', () => {
    const validationError = {
      code: 'FST_ERR_VALIDATION',
      message: 'Validation error occurred',
    } as FastifyError;

    errorHandler(validationError, mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith({
      error: 'Validation failed',
      message: 'Validation error occurred',
    });
  });

  it('should handle FST_ERR_NOT_FOUND errors', () => {
    const notFoundError = {
      code: 'FST_ERR_NOT_FOUND',
      message: 'Resource not found',
    } as FastifyError;

    errorHandler(notFoundError, mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(404);
    expect(mockReply.send).toHaveBeenCalledWith({
      error: 'Not found',
      message: 'Resource not found',
    });
  });

  it('should handle FST_REQ_FILE_TOO_LARGE errors', () => {
    const fileTooLargeError = {
      code: 'FST_REQ_FILE_TOO_LARGE',
      message: 'File too large',
    } as FastifyError;

    errorHandler(fileTooLargeError, mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(413);
    expect(mockReply.send).toHaveBeenCalledWith({
      error: 'File too large',
      message: 'The uploaded file exceeds the maximum allowed size',
    });
  });

  it('should handle generic errors with status code', () => {
    const genericError = {
      statusCode: 403,
      message: 'Forbidden',
    } as FastifyError;

    errorHandler(genericError, mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(403);
    expect(mockReply.send).toHaveBeenCalledWith({
      error: 'Forbidden',
    });
  });

  it('should handle 500 errors with generic message', () => {
    const internalError = {
      statusCode: 500,
      message: 'Database connection failed',
      stack: 'Error stack trace',
    } as FastifyError;

    errorHandler(internalError, mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Internal server error',
      })
    );
  });

  it('should default to 500 when no status code is provided', () => {
    const unknownError = {
      message: 'Unknown error',
    } as FastifyError;

    errorHandler(unknownError, mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(500);
  });

  it('should log the error', () => {
    const error = {
      message: 'Test error',
    } as FastifyError;

    errorHandler(error, mockRequest, mockReply);

    expect(mockReply.log.error).toHaveBeenCalledWith(error);
  });
});
