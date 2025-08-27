# Tax API Test Script for PowerShell
# This script tests the tax endpoint with different addresses

# Configuration
$baseUrl = "https://belabomberman.netlify.app"
$testVariantId = "test-variant"  # Replace with actual variant ID
$testPrice = 25.00

# Test addresses
$testAddresses = @(
    @{
        name = "UK (20% VAT)"
        address = @{
            address1 = "123 Test St"
            city = "London"
            country = "GB"
            postalCode = "SW1A 1AA"
            province = "England"
        }
        expectedVAT = $true
    },
    @{
        name = "Germany (19% VAT)"
        address = @{
            address1 = "123 Test St"
            city = "Berlin"
            country = "DE"
            postalCode = "10115"
            province = "Berlin"
        }
        expectedVAT = $true
    },
    @{
        name = "US (No VAT)"
        address = @{
            address1 = "123 Test St"
            city = "New York"
            country = "US"
            postalCode = "10001"
            province = "NY"
        }
        expectedVAT = $false
    }
)

function Test-TaxEndpoint {
    param(
        [hashtable]$address,
        [bool]$expectedVAT
    )
    
    $url = "$baseUrl/api/snipcart/tax"
    
    $body = @{
        eventName = "taxes.calculate"
        content = @{
            items = @(
                @{
                    id = $testVariantId
                    quantity = 1
                    price = $testPrice
                }
            )
            shippingAddress = $address
            shippingRateUserDefinedId = "standard"
        }
    } | ConvertTo-Json -Depth 10
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    Write-Host "`n📍 Testing with $($address.country) address:" -ForegroundColor Cyan
    Write-Host "   Address: $($address.address1), $($address.city), $($address.country)"
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method POST -Body $body -Headers $headers
        
        if ($response.taxes -and $response.taxes.Count -gt 0) {
            $tax = $response.taxes[0]
            Write-Host "   ✅ Tax calculated: $($tax.name) - `$$($tax.amount) ($($tax.rate)%)" -ForegroundColor Green
            
            if ($expectedVAT -and $tax.amount -gt 0) {
                Write-Host "   ✅ VAT is being charged as expected" -ForegroundColor Green
            } elseif ($expectedVAT -and $tax.amount -eq 0) {
                Write-Host "   ⚠️  Expected VAT but got 0 - check Printful VAT settings" -ForegroundColor Yellow
            } elseif (-not $expectedVAT -and $tax.amount -eq 0) {
                Write-Host "   ✅ No VAT charged (expected for non-EU address)" -ForegroundColor Green
            }
        } else {
            Write-Host "   ⚠️  No taxes returned" -ForegroundColor Yellow
            if ($expectedVAT) {
                Write-Host "   ❌ Expected VAT but none calculated" -ForegroundColor Red
            } else {
                Write-Host "   ✅ No VAT (expected for non-EU address)" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "   ❌ Error testing tax endpoint: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $errorResponse = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorResponse)
            $errorBody = $reader.ReadToEnd()
            Write-Host "   Error details: $errorBody" -ForegroundColor Red
        }
    }
}

# Main test function
Write-Host "🧪 Tax/VAT Setup Test Suite" -ForegroundColor Magenta
Write-Host "Testing endpoint: $baseUrl/api/snipcart/tax`n"

# Test each address
foreach ($testCase in $testAddresses) {
    Test-TaxEndpoint -address $testCase.address -expectedVAT $testCase.expectedVAT
}

Write-Host "`n📋 Tax Setup Summary:" -ForegroundColor Cyan
Write-Host "1. If no VAT is calculated for EU addresses: Check Printful VAT settings"
Write-Host "2. If tax API is not called: Verify Snipcart tax webhook configuration"
Write-Host "3. If tax calculation fails: Check server logs for errors"
Write-Host "4. Configure Snipcart tax webhook at: https://yourdomain.com/api/snipcart/tax"
