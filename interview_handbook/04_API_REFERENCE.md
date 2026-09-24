# MarketMind AI — Complete RESTful API Reference

## Global Headers & Conventions
- **Base URL**: `http://localhost:5000/api/v1` (Production: `https://api.marketmind.ai/api/v1`)
- **Authentication**: `Authorization: Bearer <accessToken>` (HMAC SHA256 JWT)
- **Content-Type**: `application/json`
- **Error Standard**: RFC 7807 Problem Details (`{ error: string, message: string, details?: any[] }`)

---

## Complete API Endpoint Matrix

| Method | Endpoint | Auth Required | Allowed Roles | Controller | Service | Database Models | External API | Success Code |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | No | Any | Inline handler | None | None | None | `200 OK` |
| `GET` | `/api/v1` | No | Any | Inline handler | None | None | None | `200 OK` |
| `POST`| `/api/v1/auth/register` | No | Any | `AuthController.register` | `AuthService.register` | `User`, `SellerProfile` | None | `201 Created` |
| `POST`| `/api/v1/auth/login` | No (Rate 10/15m)| Any | `AuthController.login` | `AuthService.login` | `User`, `SellerProfile` | None | `200 OK` |
| `POST`| `/api/v1/auth/refresh` | No | Any | `AuthController.refresh` | `AuthService.refreshTokens`| `User` | None | `200 OK` |
| `GET` | `/api/v1/auth/me` | Yes | Any | `AuthController.getMe` | `AuthService.getMe` | `User`, `SellerProfile` | None | `200 OK` |
| `GET` | `/api/v1/catalog/categories` | No | Any | `CatalogController.getCategories` | `CatalogService.getCategories`| `Category` | None | `200 OK` |
| `POST`| `/api/v1/catalog/categories` | Yes | `ADMIN` | `CatalogController.createCategory` | `CatalogService.createCategory`| `Category` | None | `201 Created` |
| `GET` | `/api/v1/catalog/products` | No | Any | `CatalogController.getProducts` | `CatalogService.getProducts` | `Product`, `Category`, `ProductVariant` | None | `200 OK` |
| `GET` | `/api/v1/catalog/products/:slug` | No | Any | `CatalogController.getProductBySlug` | `CatalogService.getProductBySlug`| `Product`, `ProductVariant`, `Inventory` | None | `200 OK` |
| `POST`| `/api/v1/catalog/products` | Yes | `SELLER`, `ADMIN` | `CatalogController.createProduct` | `CatalogService.createProduct` | `Product`, `Category` | None | `201 Created` |
| `POST`| `/api/v1/catalog/products/:id/variants`| Yes | `SELLER`, `ADMIN` | `CatalogController.createVariant` | `CatalogService.createVariant` | `ProductVariant`, `Inventory` | None | `201 Created` |
| `PATCH`|`/api/v1/catalog/products/:id/status` | Yes | `SELLER`, `ADMIN` | `CatalogController.updateStatus` | `CatalogService.updateStatus` | `Product` | None | `200 OK` |
| `GET` | `/api/v1/cart` | Yes | `CUSTOMER` | `CartController.getCart` | `CartService.getCart` | `CartItem`, `ProductVariant` | None | `200 OK` |
| `POST`| `/api/v1/cart/items` | Yes | `CUSTOMER` | `CartController.addItem` | `CartService.addItem` | `CartItem`, `ProductVariant`, `Inventory` | None | `200 OK` |
| `DELETE`|`/api/v1/cart/items/:variantId` | Yes | `CUSTOMER` | `CartController.removeItem` | `CartService.removeItem` | `CartItem` | None | `200 OK` |
| `POST`| `/api/v1/orders/checkout` | Yes | `CUSTOMER` | `OrdersController.checkout` | `OrdersService.checkout` | `Order`, `OrderItem`, `Inventory`, `Outbox` | None | `201 Created` |
| `GET` | `/api/v1/orders/my-orders` | Yes | `CUSTOMER` | `OrdersController.getMyOrders` | `OrdersService.getCustomerOrders`| `Order`, `OrderItem`, `PaymentTransaction` | None | `200 OK` |
| `GET` | `/api/v1/orders/:id` | Yes | `CUSTOMER`, `ADMIN` | `OrdersController.getOrderById` | `OrdersService.getOrderById` | `Order`, `OrderItem` | None | `200 OK` |
| `POST`| `/api/v1/payments/create-order` | Yes | `CUSTOMER` | `PaymentsController.createRazorpayOrder` | `PaymentsService.createRazorpayOrder` | `Order`, `PaymentTransaction` | Razorpay API | `201 Created` |
| `POST`| `/api/v1/payments/verify` | Yes | `CUSTOMER` | `PaymentsController.verifyPayment` | `PaymentsService.verifyPayment` | `PaymentTransaction`, `Order`, `Inventory`, `Outbox` | None | `200 OK` |
| `POST`| `/api/v1/payments/webhook` | No (HMAC header) | Public | `PaymentsController.handleWebhook` | `PaymentsService.handleWebhook` | `ProcessedEvent`, `PaymentTransaction`, `Order`, `Inventory` | None | `200 OK` |
| `GET` | `/api/v1/ai/recommendations` | No | Any | `AIController.getRecommendations` | `RecommendationEngineService.getRecommendations` | `Product`, `ProductVariant`, `Category` | Bedrock (optional) | `200 OK` |
| `POST`| `/api/v1/ai/support/chat` | Yes | Any | `AIController.supportChat` | `SupportAgentService.handleSupportQuery` | `Order`, `User` | Bedrock KB RAG | `200 OK` |
| `POST`| `/api/v1/ai/seller-copilot/generate` | Yes | `SELLER`, `ADMIN` | `AIController.generateListing` | `AIService.generateSellerListing` | `Product` (DRAFT status) | Bedrock Claude 3 | `201 Created` |
| `POST`| `/api/v1/ai/seller-copilot/approve/:id` | Yes | `SELLER`, `ADMIN` | `AIController.approveListing` | `AIService.approveProductListing` | `Product` (ACTIVE status) | None | `200 OK` |
| `GET` | `/api/v1/ai/inventory/forecast` | Yes | `SELLER`, `ADMIN` | `AIController.getInventoryForecast`| `InventoryIntelligenceService.getInventoryForecast` | `Product`, `ProductVariant`, `Inventory` | None | `200 OK` |
| `GET` | `/api/v1/ai/anomalies/investigate` | Yes | `ADMIN` | `AIController.investigateAnomalies` | `AnomalyInvestigatorService.investigateAnomalies` | `Order`, `Refund` | None | `200 OK` |
| `GET` | `/api/v1/reviews/intelligence/:id` | No | Any | `ReviewsController.getIntelligence`| `ReviewsService.getReviewIntelligence` | `Review` | None | `200 OK` |
| `POST`| `/api/v1/reviews` | Yes | `CUSTOMER` | `ReviewsController.createReview` | `ReviewsService.createReview` | `Review`, `Outbox`, `Product` | None | `201 Created` |
| `GET` | `/api/v1/analytics/revenue` | Yes | `SELLER`, `ADMIN` | `AnalyticsController.getRevenue` | `AnalyticsService.getRevenueByProduct`| `Product`, `ProductVariant`, `OrderItem` | None | `200 OK` |
| `POST`| `/api/v1/analytics/ask` | Yes | `SELLER`, `ADMIN` | `AnalyticsController.askBusinessAnalyst`| `AnalyticsService.askBusinessAnalyst` | `Product`, `ProductVariant`, `OrderItem` | None | `200 OK` |
