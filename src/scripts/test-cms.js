import { cmsApiService } from '../services/cmsApiService.js';

async function testCMSConnection() {
    console.log('🧪 Testing CMS API Connection...\n');

    try {
        const results = await cmsApiService.testCMSConnection();

        console.log('📊 TEST RESULTS:');
        console.log('================\n');

        let successCount = 0;
        let totalTests = results.length;

        results.forEach((result, index) => {
            console.log(`${index + 1}. ${result.test}:`);
            console.log(`   Status: ${result.ok ? '✅ SUCCESS' : '❌ FAILED'}`);

            if (result.ok) {
                successCount++;
                if (result.value) {
                    console.log(`   Details:`, result.value);
                }
            } else {
                console.log(`   Error: ${result.error}`);
            }
            console.log('');
        });

        console.log('📈 SUMMARY:');
        console.log('===========');
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${successCount}`);
        console.log(`Failed: ${totalTests - successCount}`);
        console.log(`Success Rate: ${Math.round((successCount / totalTests) * 100)}%`);

        if (successCount === totalTests) {
            console.log('\n🎉 All CMS API tests passed! The service is working correctly.');
        } else if (successCount > 0) {
            console.log('\n⚠️  Some CMS API tests passed. The service may work with fallbacks.');
        } else {
            console.log('\n💥 All CMS API tests failed. Check your network connection and API endpoints.');
        }

    } catch (error) {
        console.error('💥 Test suite failed:', error);
    }
}

// Run the test
testCMSConnection();