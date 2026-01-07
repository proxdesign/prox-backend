# Amazon Product Advertising API Setup

This guide explains how to set up the Amazon Product Advertising API for real product data integration.

## Overview

The Prox Autonomous Discovery platform includes a comprehensive Amazon Product Advertising API integration that:

- Fetches real product images, prices, and ratings from Amazon
- Updates the product database with current information
- Provides fallback functionality when API credentials aren't configured
- Handles rate limiting and AWS signature authentication
- Batch processes product updates for efficiency

## Prerequisites

1. **Amazon Associates Account**: You need an approved Amazon Associates account
2. **Amazon Product Advertising API Access**: Apply for PA-API access through your Associates account
3. **AWS IAM Credentials**: Create IAM credentials for API access

## Setup Steps

### 1. Amazon Associates Account Setup

1. Go to [Amazon Associates](https://affiliate-program.amazon.com/)
2. Sign up and get your account approved
3. Note your **Associate Tag** (also called Partner Tag)

### 2. Product Advertising API Access

1. Go to [Amazon Advertising API](https://advertising.amazon.com/API/docs/en-us/product-advertising-api/v5/overview)
2. Apply for PA-API access through your Associates dashboard
3. Wait for approval (can take 1-7 days)

### 3. AWS IAM Credentials

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Create a new user with programmatic access
3. Attach the `ProductAdvertisingAPIFullAccess` policy
4. Save your **Access Key ID** and **Secret Access Key**

### 4. Environment Variables

Add these environment variables to your `.env` file:

```bash
# Amazon Product Advertising API Configuration
AMAZON_ACCESS_KEY_ID=your_aws_access_key_id
AMAZON_SECRET_ACCESS_KEY=your_aws_secret_access_key
AMAZON_PARTNER_TAG=your_amazon_associate_tag
AMAZON_REGION=us-east-1  # Optional, defaults to us-east-1
```

## Testing the Integration

### 1. Test Credentials and Basic Functionality

```bash
cd /path/to/prox_autonomous_discovery
python3 scripts/test_amazon_api.py
```

### 2. Check API Status via Web Interface

Visit `http://localhost:8000/amazon/credentials` to check if credentials are configured.

### 3. Test Single Product Update

```bash
# Update a single product (replace 1 with actual product ID)
curl -X PUT "http://localhost:8000/amazon/update-product/1"
```

### 4. Test Bulk Update

```bash
# Update up to 10 products
curl -X POST "http://localhost:8000/amazon/update-products?max_products=10"
```

## API Endpoints

The following endpoints are available for Amazon integration:

### Check Credentials Status
```
GET /amazon/credentials
```
Returns whether API credentials are configured and fallback mode status.

### Get Update Status
```
GET /amazon/status
```
Returns database statistics about Amazon data updates.

### Update Single Product
```
PUT /amazon/update-product/{product_id}
```
Updates a specific product with Amazon data.

### Bulk Update Products
```
POST /amazon/update-products?max_products={limit}
```
Updates multiple products in batch (default limit: 50).

## Implementation Details

### Fallback Mode

When Amazon API credentials aren't configured, the system automatically uses fallback mode:

- Returns placeholder data with realistic values
- Uses Unsplash images for product photos
- Maintains all functionality without breaking
- Clearly indicates fallback mode in logs and responses

### Rate Limiting

The integration respects Amazon's API rate limits:

- Batch processing with 1-second delays
- Maximum 10 items per API call
- Exponential backoff on errors
- Comprehensive error handling

### Data Storage

Amazon data is stored in several ways:

1. **Product Updates**: Core product fields (price, image, rating) are updated
2. **Amazon Metadata**: Full API response stored in `amazon_data` JSONB column
3. **Update Tracking**: `last_updated` timestamp for refresh management

### AWS Signature v4 Authentication

The integration implements AWS Signature v4 authentication:

- Proper request signing for Amazon's API
- Region-specific endpoint handling
- Secure credential management
- Headers and payload signing

## Troubleshooting

### Common Issues

1. **"Credentials not configured"**: Check environment variables
2. **"API access denied"**: Verify PA-API access approval
3. **"Invalid signature"**: Check AWS credentials and region
4. **"Rate limited"**: Automatic retry with backoff

### Debug Mode

Enable debug logging by setting:

```bash
LOG_LEVEL=DEBUG
```

### Test Without Real Credentials

The system works perfectly in fallback mode for development and testing:

```bash
# This will use placeholder data
python3 scripts/test_amazon_api.py
```

## Production Deployment

### Security Considerations

1. Use AWS IAM roles when possible
2. Rotate credentials regularly
3. Monitor API usage and costs
4. Implement proper logging and monitoring

### Performance Optimization

1. **Batch Updates**: Use bulk endpoints for efficiency
2. **Caching**: API responses are cached in database
3. **Selective Updates**: Only update products that need refreshing
4. **Background Processing**: Run updates as background tasks

### Monitoring

Monitor these metrics:

- API request success rate
- Update completion rate
- Fallback mode usage
- Product data freshness

## Cost Management

Amazon PA-API has usage limits and potential costs:

- **Free Tier**: 8,640 requests per day for approved Associates
- **Paid Tier**: Additional requests at $0.50 per 1,000 requests
- **Rate Limits**: 1 request per second for free tier

### Optimization Tips

1. Update products selectively (only when needed)
2. Use longer cache periods for stable data
3. Batch multiple ASINs per request
4. Monitor daily usage

## Support

For issues with:

- **Amazon Associates**: Contact Amazon Associates support
- **PA-API Access**: Check Amazon Advertising Console
- **Technical Issues**: Review logs and error messages
- **Integration Problems**: Check network connectivity and credentials

## Additional Resources

- [Amazon PA-API Documentation](https://advertising.amazon.com/API/docs/en-us/product-advertising-api/v5/overview)
- [AWS Signature v4 Process](https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html)
- [Amazon Associates Program](https://affiliate-program.amazon.com/)
- [AWS IAM User Guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/)