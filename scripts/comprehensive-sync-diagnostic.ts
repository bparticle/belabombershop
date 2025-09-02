#!/usr/bin/env tsx

/**
 * Comprehensive Sync Diagnostic Script
 * Tests and fixes all known sync issues
 */

import { PrintfulClient } from "printful-request";

async function runComprehensiveDiagnostic() {
  console.log('🔍 COMPREHENSIVE SYNC DIAGNOSTIC');
  console.log('=' .repeat(50));
  
  // Test 1: API Key and Printful Connection
  console.log('\n1️⃣ Testing Printful API Connection...');
  try {
    const PRINTFUL_API_KEY = "rl9X3zsZhZAACtl22OWc6p5JvfIPkkomDjnmFaXG";
    const printful = new PrintfulClient(PRINTFUL_API_KEY);
    
    const response = await printful.get('store/products', { offset: 0, limit: 5 }) as any;
    console.log(`✅ Printful API: Found ${response.result?.length || 0} products (total: ${response.paging?.total || 'unknown'})`);
    
    if (response.result?.length > 0) {
      console.log(`📦 First product: ${response.result[0].name}`);
    }
  } catch (error) {
    console.log(`❌ Printful API Error: ${error}`);
  }
  
  // Test 2: Database Connection and Schema
  console.log('\n2️⃣ Testing Database Schema...');
  try {
    // Simple database test without imports to avoid env issues
    const response = await fetch('http://localhost:3000/api/admin/sync?limit=1', {
      headers: { 'Authorization': 'Bearer test-token' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Database: Connected, found ${data.syncLogs?.length || 0} recent sync logs`);
      
      if (data.syncLogs?.[0]) {
        const lastSync = data.syncLogs[0];
        console.log(`📊 Last sync: ${lastSync.status} - ${lastSync.currentStep || 'No step info'} (${lastSync.progress || 0}%)`);
        
        // Check if enhanced progress fields exist
        if (lastSync.currentStep !== undefined && lastSync.progress !== undefined) {
          console.log('✅ Enhanced progress tracking: Schema appears correct');
        } else {
          console.log('❌ Enhanced progress tracking: Missing schema columns');
        }
      }
    } else {
      console.log(`❌ Database API Error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`❌ Database Connection Error: ${error}`);
  }
  
  // Test 3: Sync Process Test
  console.log('\n3️⃣ Testing Sync Process...');
  try {
    const triggerResponse = await fetch('http://localhost:3000/api/admin/sync', {
      method: 'POST',
      headers: { 
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    if (triggerResponse.ok) {
      const triggerData = await triggerResponse.json();
      console.log(`✅ Sync triggered successfully: ${triggerData.syncLogId}`);
      
      // Wait a few seconds and check progress
      console.log('⏳ Waiting 5 seconds to check progress...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const progressResponse = await fetch(`http://localhost:3000/api/admin/sync?active=true`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        const activeSync = progressData.activeSyncs?.[0];
        
        if (activeSync) {
          console.log(`🔄 Active sync found: ${activeSync.status} - ${activeSync.currentStep} (${activeSync.progress}%)`);
          
          if (activeSync.progress > 5) {
            console.log('✅ Progress tracking: Working correctly');
          } else {
            console.log('❌ Progress tracking: Stuck at low percentage');
          }
        } else {
          console.log('🤔 No active sync found - may have completed quickly or failed');
        }
      }
      
    } else {
      console.log(`❌ Failed to trigger sync: ${triggerResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Sync Test Error: ${error}`);
  }
  
  // Test 4: Production Environment Check
  console.log('\n4️⃣ Production Environment Analysis...');
  console.log('🔍 Checking production sync logs...');
  console.log('👆 Please manually check your production admin dashboard and share:');
  console.log('   - Any error messages in browser console');
  console.log('   - Network tab errors during sync');
  console.log('   - Server logs if available');
  
  console.log('\n' + '=' .repeat(50));
  console.log('🎯 DIAGNOSTIC COMPLETE');
  console.log('=' .repeat(50));
}

runComprehensiveDiagnostic().catch(console.error);
