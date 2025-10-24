

describe('Inventory Management Page', () => {
  const TEST_USER_EMAIL = 'betu@gmail.com';
  const TEST_USER_PASSWORD = 'omenim';

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.session([TEST_USER_EMAIL, TEST_USER_PASSWORD], () => {
      cy.visit('https://feedlink-one.vercel.app/signin?role=producer');
      cy.contains('button', 'Yes, Sign In', { timeout: 10000 }).click();
      cy.get('input[id="email"]', { timeout: 10000 }).type(TEST_USER_EMAIL);
      cy.get('input[id="password"]', { timeout: 10000 }).type(TEST_USER_PASSWORD);
      cy.get('button[type="submit"]', { timeout: 10000 }).click();
      cy.url().should('include', '/dashboard', { timeout: 10000 });
    });

    cy.intercept('GET', '**/api/listings*').as('getListings');
    cy.intercept('GET', '**/api/users*').as('getProducers');
    cy.intercept('POST', '**/api/listings/').as('addListing');
    cy.intercept('PUT', '**/api/listings/*').as('updateListing');
    cy.intercept('DELETE', '**/api/listings/*').as('deleteListing');
    cy.intercept('POST', '**/utils/upload-csv/').as('uploadCsv');

    cy.visit('https://feedlink-one.vercel.app/inventory');
    cy.wait('@getListings', { timeout: 10000 });

    cy.get('body').then(($body) => {
      const modalSelectors = '[role="dialog"], .modal, .fixed.inset-0.bg-black.bg-opacity-50';
      const closeButtonSelectors = 'button:contains("Cancel"),button:contains("Close"),button:contains("Dismiss"),button:contains("Back"),[aria-label*="close"],[aria-label*="cancel"],[aria-label*="dismiss"],button svg,button i,.close,.btn-close,span.close,div.close,.modal-close';

      if ($body.find(modalSelectors).length > 0) {
        cy.log('Modal detected, attempting to close.');
        cy.screenshot('modal-detected-before-close', { log: false });
        cy.get(modalSelectors).then(($modal) => {
          cy.log('Modal HTML:', $modal.html().substring(0, 500));
        });
        cy.get(closeButtonSelectors, { timeout: 12000, log: false }).then(($buttons) => {
          if ($buttons.length > 0) {
            cy.log('Found close buttons, clicking to dismiss modals.');
            cy.wrap($buttons).click({ multiple: true, force: true });
          } else {
            cy.log('No close buttons found, attempting alternative dismissal methods.');
            cy.get('body').click('topLeft', { force: true });
            cy.get('body').type('{esc}', { force: true });
          }
        });
        cy.get(modalSelectors, { timeout: 12000, log: false }).should('not.exist');
        cy.log('Modal dismissed successfully.');
        cy.screenshot('modal-detected-after-close', { log: false });
      } else {
        cy.log('No modals detected, proceeding with tests.');
      }
    });

    cy.url().should('include', '/inventory', { timeout: 10000 });
    cy.get('table tbody tr', { timeout: 15000 }).should('not.contain', 'Loading...');
  });

  it('should display the summary, filters, and table correctly', () => {
    cy.contains('h1', 'Inventory Management', { timeout: 10000 }).should('be.visible');
    cy.contains('div', 'Total items').should('be.visible');
    cy.contains('div', 'Expiring soon').should('be.visible');
    cy.contains('div', 'Expired items').should('be.visible');
    cy.get('input[placeholder="Search..."]').should('be.visible');
    cy.get('div.font-nunito.border.border-gray-300.rounded.px-3.py-1.cursor-pointer').should('have.length.at.least', 2); // CustomSelect for category and status
    cy.contains('button', 'Upload').should('be.visible');
    cy.get('table').should('be.visible');
  });

  it('should filter items by search term', () => {
    const searchTerm = 'edible';
    cy.get('input[placeholder="Search..."]', { timeout: 10000 }).type(searchTerm);
    cy.wait('@getListings', { timeout: 10000 });
    cy.get('table tbody tr', { timeout: 15000 }).should('not.contain', 'Loading...');
    cy.get('table tbody tr td:first-child', { timeout: 10000 }).each(($cell) => {
      cy.wrap($cell).invoke('text').then((text) => {
        expect(text.toLowerCase()).to.include(searchTerm.toLowerCase());
      });
    });
  });

  it('should filter items by status using CustomSelect', () => {
    cy.get('div.font-nunito.border.border-gray-300.rounded.px-3.py-1.cursor-pointer', { timeout: 15000 })
      .contains('All status')
      .click({ force: true });
    cy.get('ul.absolute.z-10.w-full.mt-1.border.border-gray-300.rounded.bg-white', { timeout: 10000 })
      .contains('Available')
      .click();
    cy.wait('@getListings', { timeout: 10000 });
    cy.get('table tbody tr', { timeout: 10000 }).each(($row) => {
      cy.wrap($row).find('td').last().find('span').should('have.text', 'Available');
    });
  });

  it('should filter items by upload date', () => {
    const today = new Date().toISOString().split('T')[0];
    cy.get('input[type="date"]', { timeout: 10000 }).type(today);
    cy.wait('@getListings', { timeout: 10000 });
    cy.get('table tbody tr', { timeout: 10000 }).should('exist');
  });

  it('should open the "Add Item" modal and fill the form', () => {
    cy.intercept('POST', '**/api/listings/', { statusCode: 201, body: { id: 999 } }).as('addItemSuccess');
    cy.contains('button', 'Upload', { timeout: 10000 }).click();
    cy.contains('button', 'Manually', { timeout: 10000 }).click();
    cy.wait('@getProducers', { timeout: 10000 });
    cy.get('div[role="dialog"], .max-w-xl.mx-auto.p-6.bg-white.rounded-lg.shadow-lg', { timeout: 15000 }).should('be.visible');
    cy.contains('label', 'Product Type').should('be.visible');

    cy.get('select').eq(0).select('edible');
    cy.get('select').eq(1).select('1'); 
    cy.get('input[type="text"]').eq(0).type('Vegetable'); 
    cy.get('textarea').type('Test description');
    cy.get('input[type="number"]').eq(0).type('50'); 
    cy.get('select').eq(2).select('kg');
    cy.get('input[type="number"]').eq(1).type('10');
    cy.get('input[type="datetime-local"]').eq(0).type('2025-12-31T10:00');
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from(''),
      fileName: 'test-image.jpg',
      mimeType: 'image/jpeg',
    });
    cy.get('select').eq(3).select('manual');
    cy.get('input[type="datetime-local"]').eq(1).type('2025-12-31T12:00'); 

    cy.contains('button', 'Add Item', { timeout: 10000 }).click();
    cy.wait('@addItemSuccess', { timeout: 10000 });
    cy.contains('Product uploaded successfully!', { timeout: 10000 }).should('be.visible');
  });

  it('should show validation errors on the "Add Item" form', () => {
    cy.intercept('POST', '**/api/listings/', { statusCode: 400 }).as('addItemFailure');
    cy.contains('button', 'Upload', { timeout: 10000 }).click();
    cy.contains('button', 'Manually', { timeout: 10000 }).click();
    cy.wait('@getProducers', { timeout: 10000 });
    cy.get('div[role="dialog"], .max-w-xl.mx-auto.p-6.bg-white.rounded-lg.shadow-lg', { timeout: 15000 }).should('be.visible');
    cy.contains('button', 'Add Item', { timeout: 10000 }).click();
    cy.on('window:alert', (str) => {
      expect(str).to.include('Please select the product type');
    });
  });

  it('should edit an existing item', () => {
    cy.intercept('PUT', '**/api/listings/*', { statusCode: 200 }).as('updateItemSuccess');
    cy.get('table tbody tr', { timeout: 15000 }).then(($rows) => {
      if ($rows.length > 0) {
        cy.get('table tbody tr', { timeout: 10000 }).first().click({ force: true });
        cy.contains('h2', 'Edit Item Details', { timeout: 20000 }).should('be.visible');
        cy.get('input[type="number"]', { timeout: 10000 }).first().clear().type('999');
        cy.contains('button', 'Save', { timeout: 10000 }).click();
        cy.wait('@updateItemSuccess', { timeout: 10000 });
        cy.contains('Product updated successfully!', { timeout: 10000 }).should('be.visible');
      } else {
        cy.log('No table rows available, skipping edit test.');
      }
    });
  });
});