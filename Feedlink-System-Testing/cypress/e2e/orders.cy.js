
describe('Orders Management Page', () => {

  const TEST_USER_EMAIL = 'betu@gmail.com';
  const TEST_USER_PASSWORD = 'omenim';

  beforeEach(() => {
    cy.session([TEST_USER_EMAIL, TEST_USER_PASSWORD], () => {
      cy.log('Logging in for the Orders test...');
      cy.visit('https://feedlink-one.vercel.app/signin?role=producer');
      cy.contains('button', 'Yes, Sign In').click();
      cy.get('input[id="email"]').type(TEST_USER_EMAIL);
      cy.get('input[id="password"]').type(TEST_USER_PASSWORD);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');
    });

    cy.visit('https://feedlink-one.vercel.app/orders');
    cy.url().should('include', '/orders');
  });

  it('displays orders summary with correct counts', () => {
    cy.contains('Total customers').parent().find('p.text-3xl').invoke('text').should('match', /^\d+$/);
    cy.contains('Total orders').parent().find('p.text-3xl').invoke('text').should('match', /^\d+$/);
  });

  it('displays orders table with correct data', () => {
    cy.get('table tbody tr').should('have.length.greaterThan', 0);
    cy.contains('th', 'Buyer').should('be.visible');
    cy.contains('th', 'Status').should('be.visible');

    cy.get('table').contains('td', 'picked').should('be.visible');
    cy.get('table').contains('td', 'pending').should('be.visible');
  });

  it('filters by status (pending)', () => {
    cy.contains('label', 'pending').click();


    cy.get('table').find('td span').should('not.contain', 'picked');
    cy.get('table').find('td span').first().should('contain', 'pending');
  });

  it('filters by status (picked)', () => {
    cy.contains('label', 'picked').click();

   
    cy.get('table').find('td span').should('not.contain', 'pending');
    cy.get('table').find('td span').first().should('contain', 'picked');
  });

  it('searches by user name', () => {
    let userNameToSearch;
    cy.get('table tbody tr').first().find('td').first().invoke('text').then((text) => {
      userNameToSearch = text.trim();
      cy.get('input[placeholder="Search by user..."]').clear().type(userNameToSearch);
      cy.get('table tbody tr').should('have.length.greaterThan', 0);
      cy.get('table tbody tr').each(($row) => {
        cy.wrap($row).find('td').first().should('contain', userNameToSearch);
      });
    });
  });


  it.skip('filters by order date', () => {
    let dateToFilter;
    cy.get('table tbody tr').first().find('td').eq(3).invoke('text').then((text) => {
      dateToFilter = text.trim();
      const [day] = dateToFilter.split('/');
      cy.log(`Found date to filter for: ${dateToFilter}`);

      cy.get('YOUR_UNIQUE_SELECTOR').click();

      cy.get('.rdp-day').contains(day).click();
      cy.get('table tbody tr').should('have.length.greaterThan', 0);
      cy.get('table tbody tr').each(($row) => {
        cy.wrap($row).find('td').eq(3).should('contain', dateToFilter);
      });
    });
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
        cy.log('Pagination not found, skipping test. Likely less than 7 orders.');
      }
    });
  });

  it('should display "No orders found" when filters return nothing', () => {
    const nonExistentUser = 'xyznonexistentuser123';
    cy.get('input[placeholder="Search by user..."]').type(nonExistentUser);
    cy.contains('No orders found').should('be.visible');
  });
});