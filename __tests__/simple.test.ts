describe('Simple Test', () => {
  test('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });
  
  test('should handle strings', () => {
    expect('hello world').toContain('world');
  });
});