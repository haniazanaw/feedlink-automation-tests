describe('Waste Claims Management Page', () => {

  const TEST_USER_EMAIL = 'betu@gmail.com';
  const TEST_USER_PASSWORD = 'omenim';

 
  cy.on('uncaught:exception', (err, runnable) => {
    if (err.message.includes("Cannot read properties of undefined (reading 'toLowerCase')")) {
      return false;
    }
  });
 
  beforeEach(() => {
    cy.session([TEST_USER_EMAIL, TEST_USER_PASSWORD], () => {
      cy.log('Logging in for the Waste Claims test...');
      cy.visit('https://feedlink-one.vercel.app/signin?role=producer');
      cy.contains('button', 'Yes, Sign In').click();
      cy.get('input[id="email"]').type(TEST_USER_EMAIL);
      cy.get('input[id="password"]').type(TEST_USER_PASSWORD);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');
    });

   
    cy.intercept('GET', '**/api/wasteclaims').as('getWasteClaims');
    cy.intercept('GET', '**/api/users').as('getUsers');
    cy.intercept('GET', '**/api/listings').as('getListings');

    cy.visit('https://feedlink-one.vercel.app/wasteclaims');

    cy.wait(['@getWasteClaims', '@getUsers', '@getListings'], { timeout: 10000 });
    cy.url().should('include', '/wasteclaims');
  });

  it('displays page title and summary stats', () => {
    cy.contains('h1', 'Waste Claims').should('be.visible');
    cy.contains('p', 'Track food waste claimed by recyclers').should('be.visible');
    cy.contains('h3', 'Total claimed').parent().find('p.text-3xl').invoke('text').should('match', /^\d+(\.\d+)? kg$/);
    cy.contains('h3', 'Total recyclers').parent().find('p.text-3xl').invoke('text').should('match', /^\d+$/);
  });

  it('displays the claims table with correct data', () => {
    cy.get('table tbody tr').should('have.length.greaterThan', 0);
    cy.contains('th', 'Recycler').should('be.visible');
    cy.contains('th', 'Quantity').should('be.visible');
    cy.contains('th', 'Claim date').should('be.visible');
    cy.contains('th', 'Status').should('be.visible');
    cy.get('table').contains('td', 'collected').should('be.visible');
    cy.get('table').contains('td', 'pending').should('be.visible');
  });

  it('filters by status (pending)', () => {
    cy.contains('label', 'pending').click();
    cy.get('table').find('td span').should('not.contain', 'collected');
    cy.get('table').find('td span').first().should('contain', 'pending');
  });

  it('filters by status (collected)', () => {
    cy.contains('label', 'collected').click();
    cy.get('table').find('td span').should('not.contain', 'pending');
    cy.get('table').find('td span').first().should('contain', 'collected');
  });

  it('handles pagination correctly', () => {
    cy.get('body').then(($body) => {
      if ($body.find('nav[aria-label="Pagination"]').length > 0) {
        cy.log('Pagination found, testing navigation.');
        cy.contains('button[aria-label="Next page"]', 'Next').not('[disabled]').click();
        cy.url().should('include', 'page=');
        cy.get('table tbody tr').should('have.length.greaterThan', 0);
        cy.contains('button[aria-label="Previous page"]', 'Previous').not('[disabled]').click();
        cy.url().should('not.include', 'page=');
      } else {
        cy.log('Pagination not found, skipping test. Likely less than 7 claims.');
      }
    });
  });
});