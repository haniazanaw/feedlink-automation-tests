describe('SignUpPage System Tests', () => {
  beforeEach(() => {
    cy.visit('https://feedlink-one.vercel.app/signup');
  });

  it('renders all inputs and buttons', () => {
    cy.get('input[name="firstName"]').should('exist');
    cy.get('input[name="lastName"]').should('exist');
    cy.get('input[name="email"]').should('exist');
    cy.get('input[name="tillNumber"]').should('exist');
    cy.get('input[name="address"]').should('exist');
    cy.get('input[name="password"]').should('exist');
    cy.get('input[name="confirmPassword"]').should('exist');
    cy.get('button[type="submit"]').should('exist').and('not.be.disabled');
  });

  it('shows email format validation error', () => {
    cy.get('input[name="email"]').type('invalid-email');
    cy.get('button[type="submit"]').click({ force: true });
    cy.get('input[name="email"]').parent().find('p.text-orange-500').should('contain', 'Please enter a valid email');
  });

  it('shows password length and match errors', () => {
    cy.get('input[name="password"]').type('123');
    cy.get('input[name="confirmPassword"]').type('123');
    cy.get('button[type="submit"]').click({ force: true });
    cy.get('input[name="password"]').parent().find('p.text-orange-500').should('contain', 'Password must be at least 6 characters');

    cy.get('input[name="password"]').clear().type('123456');
    cy.get('input[name="confirmPassword"]').clear().type('654321');
    cy.get('button[type="submit"]').click({ force: true });
    cy.get('input[name="confirmPassword"]').parent().find('p.text-orange-500').should('contain', 'Passwords do not match');
  });

   it('password inputs should toggle visibility', () => {
    cy.get('input[name="password"]').should('have.attr', 'type', 'password');
    cy.get('button[aria-label="Show password"]').eq(0).click();
    cy.get('input[name="password"]').should('have.attr', 'type', 'text');
    cy.get('button[aria-label="Hide password"]').eq(0).click();
    cy.get('input[name="password"]').should('have.attr', 'type', 'password');

    cy.get('input[name="confirmPassword"]').should('have.attr', 'type', 'password');
    cy.get('button[aria-label="Show password"]').eq(1).click();
    cy.get('input[name="confirmPassword"]').should('have.attr', 'type', 'text');
  });

  it('shows password validation error when less than 6 characters', () => {
    cy.get('input[name="password"]').type('123');
    cy.get('input[name="confirmPassword"]').type('123');
    cy.get('button[type="submit"]').click({ force: true });

    cy.get('input[name="password"]').parent().contains('Password must be at least 6 characters').should('be.visible');
  });

  it('shows confirm password mismatch error', () => {
    cy.get('input[name="password"]').clear().type('123456');
    cy.get('input[name="confirmPassword"]').clear().type('654321');
    cy.get('button[type="submit"]').click({ force: true });

    cy.get('input[name="confirmPassword"]').parent().contains('Passwords do not match').should('be.visible');
  });

  it('submits form successfully with valid data', () => {
  cy.intercept('POST', '/api/signup', {
    statusCode: 200,
    body: {
      id: 1,
      email: 'user@example.com',
      token: 'mock-token',
    },
  }).as('signupRequest');

  cy.get('input[name="firstName"]').type('John');
  cy.get('input[name="lastName"]').type('Doe');
  cy.get('input[name="email"]').type('user@example.com');
  cy.get('input[name="tillNumber"]').type('123456');
  cy.get('input[name="address"]').type('Nairobi');
  cy.get('input[name="password"]').type('password123');
  cy.get('input[name="confirmPassword"]').type('password123');

  cy.get('button[type="submit"]').click();

  cy.wait('@signupRequest').its('response.statusCode').should('eq', 200);

  cy.url({ timeout: 10000 }).should('include', '/signin');
});


});
describe('Producer Sign In Flow', () => {
  const PRODUCER_EMAIL = 'betu@gmail.com';
  const PRODUCER_PASSWORD = 'omenim';

  beforeEach(() => {
    cy.visit('https://feedlink-one.vercel.app/signin?role=producer');
  });

  it('should display the producer choice screen when role=producer and skipChoice is not true', () => {
    cy.contains('Welcome, Producer!', { timeout: 10000 }).should('be.visible');
    cy.contains('Do you already have a FeedLink account?').should('be.visible');
    cy.contains('button', 'Yes, Sign In').should('be.visible');
    cy.contains('button', 'No, Create Account').should('be.visible');
  });

  it('should navigate to signup when clicking "No, Create Account"', () => {
    cy.contains('button', 'No, Create Account').click();
    cy.url().should('include', '/signup');
  });

  it('should show sign-in form when clicking "Yes, Sign In"', () => {
    cy.contains('button', 'Yes, Sign In').click();
    cy.contains('Sign In', { timeout: 10000 }).should('be.visible');
    cy.get('input[id="email"]').should('be.visible');
    cy.get('input[id="password"]').should('be.visible');
  });

  it('should show error message on invalid credentials', () => {
    cy.contains('button', 'Yes, Sign In').click();

    cy.get('input[id="email"]').type('wrong@example.com');
    cy.get('input[id="password"]').type('wrongpass');

    cy.get('button[type="submit"]').click();

    cy.contains('Login failed. Please check your email and password.', { timeout: 10000 })
      .should('be.visible')
      .and('have.class', 'text-black');
  });
  it('should allow producer to sign in successfully and redirect to /dashboard', () => {
    cy.contains('button', 'Yes, Sign In').click();

    cy.get('input[id="email"]').type(PRODUCER_EMAIL);
    cy.get('input[id="password"]').type(PRODUCER_PASSWORD);

    cy.get('button[type="submit"]').click();

    cy.url({ timeout: 10000 }).should('include', '/dashboard');

  });
});



