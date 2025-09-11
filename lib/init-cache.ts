let initialized = false;

/**
 * Initialize cache warming when app starts
 * This should be called from a server component
 */
export async function initializeCache() {
  if (typeof window !== 'undefined') {
    // Client-side에서는 실행하지 않음
    return;
  }
  
  if (initialized) {
    return;
  }
  
  initialized = true;
  
  // 즉시 실행하지 않고 약간 지연 후 시작 (서버 시작 완료 후)
  setTimeout(async () => {
    try {
      // 동적 import로 CacheWarmer를 로드 (서버에서만)
      const { CacheWarmer } = await import('./cache-warmer');
      CacheWarmer.start();
      
      // 프로세스 종료시 cleanup
      process.on('SIGTERM', () => {
        CacheWarmer.stop();
      });
      
      process.on('SIGINT', () => {
        CacheWarmer.stop();
      });
    } catch (error) {
      console.error('Failed to initialize cache warmer:', error);
    }
  }, 5000); // 5초 후 시작
}