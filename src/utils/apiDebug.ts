// src/utils/apiDebug.ts - Script zum Testen der API-Verbindungen
import api from '../services/api';

export interface ApiTestResult {
  endpoint: string;
  status: 'success' | 'error' | 'timeout';
  responseTime: number;
  data?: any;
  error?: string;
}

class ApiDebugger {
  // Test alle wichtigen Endpunkte
  async testAllEndpoints(): Promise<ApiTestResult[]> {
    console.log('🔍 Starting API endpoint tests...');
    
    const endpoints = [
      { name: 'Auth Check', url: '/auth/me' },
      { name: 'Kurse', url: '/kurse' },
      { name: 'Teilnehmer', url: '/teilnehmer' },
      { name: 'Trainer', url: '/trainer' },
      { name: 'Anwesenheit', url: '/anwesenheit' },
      { name: 'Stundenplan', url: '/stundenplan' }
    ];

    const results: ApiTestResult[] = [];

    for (const endpoint of endpoints) {
      console.log(`Testing ${endpoint.name}...`);
      const result = await this.testEndpoint(endpoint.url);
      results.push({ ...result, endpoint: endpoint.name });
      
      // Kleine Pause zwischen den Tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  // Test einen einzelnen Endpunkt
  async testEndpoint(url: string): Promise<Omit<ApiTestResult, 'endpoint'>> {
    const startTime = Date.now();
    
    try {
      const response = await api.get(url);
      const responseTime = Date.now() - startTime;
      
      console.log(`✅ ${url}: ${response.status} (${responseTime}ms)`);
      
      return {
        status: 'success',
        responseTime,
        data: {
          status: response.status,
          dataLength: Array.isArray(response.data) ? response.data.length : 'object'
        }
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      if (error.code === 'ECONNABORTED') {
        console.log(`⏱️ ${url}: Timeout (${responseTime}ms)`);
        return {
          status: 'timeout',
          responseTime,
          error: 'Request timeout'
        };
      }
      
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      
      console.log(`❌ ${url}: ${status || 'Network Error'} - ${message} (${responseTime}ms)`);
      
      return {
        status: 'error',
        responseTime,
        error: `${status || 'Network Error'}: ${message}`
      };
    }
  }

  // Test die Basis-Konnektivität
  async testConnectivity(): Promise<{
    baseUrl: string;
    tokenPresent: boolean;
    networkStatus: 'online' | 'offline';
    timestamp: string;
  }> {
    console.log('🌐 Testing basic connectivity...');
    
    const baseUrl = api.defaults.baseURL || 'Unknown';
    const token = localStorage.getItem('token');
    const networkStatus = navigator.onLine ? 'online' : 'offline';
    
    console.log(`Base URL: ${baseUrl}`);
    console.log(`Token present: ${!!token}`);
    console.log(`Network status: ${networkStatus}`);
    
    return {
      baseUrl,
      tokenPresent: !!token,
      networkStatus,
      timestamp: new Date().toISOString()
    };
  }

  // Generiere einen ausführlichen Bericht
  async generateReport(): Promise<string> {
    console.log('📊 Generating API debug report...');
    
    const connectivity = await this.testConnectivity();
    const endpointResults = await this.testAllEndpoints();
    
    const report = [
      '=== API DEBUG REPORT ===',
      `Timestamp: ${connectivity.timestamp}`,
      `Base URL: ${connectivity.baseUrl}`,
      `Auth Token: ${connectivity.tokenPresent ? 'Present' : 'Missing'}`,
      `Network: ${connectivity.networkStatus}`,
      '',
      '=== ENDPOINT TESTS ===',
      ...endpointResults.map(result => 
        `${result.endpoint}: ${result.status.toUpperCase()} (${result.responseTime}ms)${
          result.error ? ` - ${result.error}` : ''
        }`
      ),
      '',
      '=== SUMMARY ===',
      `Total endpoints tested: ${endpointResults.length}`,
      `Successful: ${endpointResults.filter(r => r.status === 'success').length}`,
      `Failed: ${endpointResults.filter(r => r.status === 'error').length}`,
      `Timeouts: ${endpointResults.filter(r => r.status === 'timeout').length}`,
      `Average response time: ${Math.round(
        endpointResults.reduce((sum, r) => sum + r.responseTime, 0) / endpointResults.length
      )}ms`,
      '',
      '=== RECOMMENDATIONS ===',
      ...this.generateRecommendations(connectivity, endpointResults)
    ].join('\n');
    
    console.log(report);
    return report;
  }

  // Generiere Empfehlungen basierend auf den Test-Ergebnissen
  private generateRecommendations(
    connectivity: any, 
    results: ApiTestResult[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Check for authentication issues
    if (!connectivity.tokenPresent) {
      recommendations.push('• No authentication token found - please log in');
    }
    
    // Check for network issues
    if (connectivity.networkStatus === 'offline') {
      recommendations.push('• Network appears to be offline - check internet connection');
    }
    
    // Check for widespread failures
    const failureRate = results.filter(r => r.status === 'error').length / results.length;
    if (failureRate > 0.5) {
      recommendations.push('• Multiple endpoints failing - backend server may be down');
      recommendations.push('• Check if backend server is running on expected port');
      recommendations.push('• Verify CORS configuration on backend');
    }
    
    // Check for timeout issues
    const timeoutRate = results.filter(r => r.status === 'timeout').length / results.length;
    if (timeoutRate > 0.3) {
      recommendations.push('• High timeout rate - backend server may be slow or overloaded');
    }
    
    // Check for 401/403 errors
    const authErrors = results.filter(r => 
      r.error?.includes('401') || r.error?.includes('403')
    ).length;
    if (authErrors > 0) {
      recommendations.push('• Authentication/authorization errors detected');
      recommendations.push('• Try logging out and logging back in');
    }
    
    // Check for CORS errors
    const corsErrors = results.filter(r => 
      r.error?.toLowerCase().includes('cors') || 
      r.error?.toLowerCase().includes('network error')
    ).length;
    if (corsErrors > 0) {
      recommendations.push('• Possible CORS issues detected');
      recommendations.push('• Ensure backend CORS is configured for frontend URL');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('• All systems appear to be functioning normally');
    }
    
    return recommendations;
  }

  // Export Bericht als Download
  async exportReport(): Promise<void> {
    const report = await this.generateReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `api-debug-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Schnell-Test für Dashboard
  async quickDashboardTest(): Promise<{
    canLoadBasicData: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    console.log('🚀 Running quick dashboard test...');
    
    const issues: string[] = [];
    const suggestions: string[] = [];
    let canLoadBasicData = true;

    // Test kritische Endpunkte für Dashboard
    const criticalEndpoints = ['/kurse', '/teilnehmer', '/trainer'];
    
    for (const endpoint of criticalEndpoints) {
      try {
        const result = await this.testEndpoint(endpoint);
        if (result.status !== 'success') {
          canLoadBasicData = false;
          issues.push(`${endpoint} not accessible: ${result.error}`);
        }
      } catch (error) {
        canLoadBasicData = false;
        issues.push(`${endpoint} test failed: ${error}`);
      }
    }

    // Test Auth
    try {
      await api.get('/auth/me');
    } catch (error: any) {
      if (error.response?.status === 401) {
        issues.push('Authentication token invalid or expired');
        suggestions.push('Try logging out and logging back in');
      }
    }

    // Generelle Empfehlungen
    if (!canLoadBasicData) {
      suggestions.push('Check if Spring Boot backend is running');
      suggestions.push('Verify database connection');
      suggestions.push('Check application logs for errors');
    }

    return {
      canLoadBasicData,
      issues,
      suggestions
    };
  }
}


export default ApiDebugger;