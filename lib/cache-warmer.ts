import { getDashboardStats } from './automation-calculator';

/**
 * Cache warming utility for dashboard statistics
 */
export class CacheWarmer {
  private static intervals: NodeJS.Timeout[] = [];
  
  /**
   * Start cache warming for common threshold values
   */
  static start() {
    // 자주 사용되는 임계값들
    const commonThresholds = [0.5, 0.6, 0.7, 0.8];
    
    console.log('🔥 Starting cache warmer for dashboard stats...');
    
    // 초기 캐시 warming
    this.warmupNow(commonThresholds);
    
    // 4분마다 캐시 갱신 (TTL 5분보다 1분 빨리)
    const interval = setInterval(() => {
      this.warmupNow(commonThresholds);
    }, 4 * 60 * 1000); // 4분
    
    this.intervals.push(interval);
    
    console.log('✅ Cache warmer started - will refresh every 4 minutes');
  }
  
  /**
   * Stop all cache warming
   */
  static stop() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    console.log('🛑 Cache warmer stopped');
  }
  
  /**
   * Warm up cache immediately
   */
  private static async warmupNow(thresholds: number[]) {
    const startTime = Date.now();
    
    try {
      // 병렬로 모든 임계값에 대해 캐시 갱신
      await Promise.all(
        thresholds.map(async (threshold) => {
          try {
            await getDashboardStats(threshold);
            console.log(`📊 Warmed cache for threshold ${threshold}`);
          } catch (error) {
            console.error(`❌ Failed to warm cache for threshold ${threshold}:`, error);
          }
        })
      );
      
      const duration = Date.now() - startTime;
      console.log(`🔥 Cache warming completed in ${duration}ms`);
    } catch (error) {
      console.error('❌ Cache warming failed:', error);
    }
  }
  
  /**
   * Manually trigger cache refresh
   */
  static async refresh() {
    const commonThresholds = [0.5, 0.6, 0.7, 0.8];
    await this.warmupNow(commonThresholds);
  }
}