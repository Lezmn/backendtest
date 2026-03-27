const AppError = require('../src/utils/AppError.js');

describe('AppError Class', () => {
  test('should create error with default status 500', () => {
    const error = new AppError('Something went wrong');
    
    expect(error.message).toBe('Something went wrong');
    expect(error.status).toBe(500);
    expect(error instanceof Error).toBe(true);
  });

  test('should create error with custom status', () => {
    const error = new AppError('Not found', 404);
    
    expect(error.message).toBe('Not found');
    expect(error.status).toBe(404);
  });

  test('should have stack trace', () => {
    const error = new AppError('Test error', 400);
    
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('Test error');
  });
});
