# FinanceAngularSass

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.2.0.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Stripe Billing + Firebase Functions

The project now includes backend billing logic in [functions/src/index.ts](functions/src/index.ts):

- Callable `createCheckoutSession` (requires authenticated user)
- HTTP `stripeWebhook` with signature validation
- Firestore sync at `users/{uid}/billing/subscription`

### 1) Install and build functions

```bash
cd functions
npm install
npm run build
```

### 2) Configure Firebase secrets and Stripe price

```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```

Set `STRIPE_PRICE_ID` as an environment variable for Functions during deploy (or through your Firebase runtime config strategy).

### 3) Deploy functions

```bash
cd functions
npm run deploy
```

### 4) Configure Stripe webhook endpoint

After deploy, register the webhook URL in Stripe Dashboard pointing to `stripeWebhook` and subscribe to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### 5) Frontend flow

- Route [src/app/features/billing/billing.ts](src/app/features/billing/billing.ts) starts Stripe checkout.
- Guard [src/app/core/guards/subscription.guard.ts](src/app/core/guards/subscription.guard.ts) blocks premium routes when subscription is not active/trialing.
