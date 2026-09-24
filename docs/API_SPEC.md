# MarketMind AI — RESTful API Specification (v1)

## Base URL
- Production: `https://api.marketmind.ai/api/v1`
- Local Development: `http://localhost:4000/api/v1`

---

## 1. Authentication & Identity (`/auth`)

### 1.1 Register User
- **Method**: `POST`
- **Path**: `/auth/register`
- **Auth**: None (Rate limited: 10 req / 15 min)
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "name": "Alex Mercer",
    "role": "CUSTOMER" // "CUSTOMER" | "SELLER"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "user": { "id": "usr-123", "email": "user@example.com", "name": "Alex Mercer", "role": "CUSTOMER" },
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
  ```

### 1.2 Login User
- **Method**: `POST`
- **Path**: `/auth/login`
- **Auth**: None (Rate limited: 10 req / 15 min)
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "user": { "id": "usr-123", "email": "user@example.com", "role": "CUSTOMER" },
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
  ```

### 1.3 Refresh Access Token
- **Method**: `POST`
- **Path**: `/auth/refresh`
- **Request Body**: `{ "refreshToken": "eyJhbGci..." }`
- **Response**: `200 OK` -> `{ "accessToken": "eyJhbGci..." }`

---

## 2. Product Catalog (`/catalog`)

### 2.1 Browse & Search Products
- **Method**: `GET`
- **Path**: `/catalog/products`
- **Query Params**: `page` (int), `limit` (int), `search` (string), `categoryId` (string), `minPrice` (float), `maxPrice` (float)
- **Response**: `200 OK`
  ```json
  {
    "products": [
      {
        "id": "prod-1",
        "title": "Ergonomic Mechanical Keyboard",
        "price": 4999.00,
        "stock": 45,
        "category": "Electronics",
        "averageRating": 4.8
      }
    ],
    "pagination": { "page": 1, "totalPages": 5, "totalItems": 48 }
  }
  ```

### 2.2 Get Product Details
- **Method**: `GET`
- **Path**: `/catalog/products/:id`
- **Response**: `200 OK`

---

## 3. Cart & Inventory Reservation (`/cart`)

### 3.1 Get Cart
- **Method**: `GET`
- **Path**: `/cart`
- **Auth**: Bearer Token (`CUSTOMER`)

### 3.2 Add Item to Cart
- **Method**: `POST`
- **Path**: `/cart/items`
- **Auth**: Bearer Token (`CUSTOMER`)
- **Request Body**: `{ "productId": "prod-1", "quantity": 2 }`

---

## 4. Checkout & Orders (`/orders`)

### 4.1 Initiate Checkout
- **Method**: `POST`
- **Path**: `/orders/checkout`
- **Auth**: Bearer Token (`CUSTOMER`)
- **Request Body**:
  ```json
  {
    "shippingAddress": {
      "street": "123 Tech Park",
      "city": "Bengaluru",
      "state": "Karnataka",
      "postalCode": "560100",
      "country": "India"
    },
    "currency": "INR"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "orderId": "ord-7788",
    "status": "PENDING",
    "totalAmount": 9998.00,
    "currency": "INR",
    "razorpayOrderId": "order_Rzp12345"
  }
  ```

### 4.2 List Customer Orders
- **Method**: `GET`
- **Path**: `/orders/my-orders`
- **Auth**: Bearer Token (`CUSTOMER`)

---

## 5. Payments & Webhooks (`/payments`)

### 5.1 Verify Payment Signature (Frontend Callback)
- **Method**: `POST`
- **Path**: `/payments/verify`
- **Auth**: Bearer Token (`CUSTOMER`)
- **Request Body**:
  ```json
  {
    "razorpayOrderId": "order_Rzp12345",
    "razorpayPaymentId": "pay_Rzp98765",
    "razorpaySignature": "hmac_sha256_hash_here"
  }
  ```
- **Response**: `200 OK` -> `{ "success": true, "status": "PAID" }`

### 5.2 Razorpay Webhook Handler
- **Method**: `POST`
- **Path**: `/payments/webhook`
- **Headers**: `X-Razorpay-Signature: <hmac_sha256_digest>`
- **Response**: `200 OK` (Processed or enqueued idempotently)

---

## 6. AI Modules (`/ai`)

### 6.1 Seller Copilot: Generate Product Listing
- **Method**: `POST`
- **Path**: `/ai/copilot/generate-listing`
- **Auth**: Bearer Token (`SELLER`, `ADMIN`)
- **Request Body**:
  ```json
  {
    "productNotes": "Bluetooth noise cancelling earbuds, 30h battery, IPX5 waterproof",
    "targetAudience": "Commuters & Fitness enthusiasts",
    "targetPrice": 2999
  }
  ```
- **Response**: `200 OK` (Returns `DRAFT` listing ready for human approval)

### 6.2 Seller Copilot: Approve & Publish Listing
- **Method**: `POST`
- **Path**: `/ai/copilot/approve-listing`
- **Auth**: Bearer Token (`SELLER`, `ADMIN`)
- **Request Body**: `{ "draftId": "draft-88", "approved": true }`

### 6.3 Customer Support Agent: Inquiry
- **Method**: `POST`
- **Path**: `/ai/support/chat`
- **Auth**: Optional / Bearer Token
- **Request Body**: `{ "query": "Where is my order ord-7788?", "orderId": "ord-7788" }`

### 6.4 Hybrid Recommendations
- **Method**: `GET`
- **Path**: `/ai/recommendations/:productId`
- **Response**: `200 OK` -> Array of ranked products with explainable match reasons

---

## 7. Error Handling Standard

All errors adhere to RFC 7807 problem details:
```json
{
  "error": "BAD_REQUEST",
  "message": "Invalid inventory quantity requested",
  "details": [ { "field": "quantity", "issue": "Requested quantity exceeds available stock" } ],
  "timestamp": "2026-09-24T11:15:00.000Z"
}
```
