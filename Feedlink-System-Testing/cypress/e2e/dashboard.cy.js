

describe('Dashboard Page', () => {

  const TEST_USER_EMAIL = 'betu@gmail.com';
  const TEST_USER_PASSWORD = 'omenim';
  cy.on('uncaught:exception', (err, runnable) => {
    if (err.message.includes("Cannot read properties of undefined (reading 'toLowerCase')")) {
      return false;
    }
  });

  beforeEach(() => {
  
    cy.session([TEST_USER_EMAIL, TEST_USER_PASSWORD], () => {
      cy.visit('https://feedlink-one.vercel.app/signin?role=producer');
      cy.contains('button', 'Yes, Sign In').click();
      cy.get('input[id="email"]').type(TEST_USER_EMAIL);
      cy.get('input[id="password"]').type(TEST_USER_PASSWORD);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');
    });
    cy.intercept('GET', '**/api/orders').as('getOrders');
    cy.intercept('GET', '**/api/wasteclaims').as('getWasteClaims');
    cy.intercept('GET', '**/api/listings').as('getListings');

    cy.visit('https://feedlink-one.vercel.app/dashboard');
    cy.wait(['@getOrders', '@getWasteClaims', '@getListings'], { timeout: 10000 });
  });

  it('should display the main dashboard elements', () => {
    cy.contains('h1', 'Dashboard Overview').should('be.visible');
    cy.contains('p', 'Welcome Back !!!').should('be.visible');
  });

  it('should display all four metric cards with correct titles and styles', () => {
    const metrics = [
      { title: "Total food diverted (KGS)", trend: "Every kg feeds hope" },
      { title: "Revenue recovered (KSH)", trend: "Funding sustainability" },
      { title: "Carbon emissions saved (T)", trend: "Cooling the planet" },
      { title: "Recycling partners", trend: "Growing green network" }
    ];

    metrics.forEach((metric, index) => {
      cy.contains('p', metric.title).should('be.visible');
      cy.contains(metric.trend).should('be.visible'); 

      const card = cy.contains('p', metric.title).parents('.bg-\\[var\\(--primary-color\\)\\], .bg-\\[\\#006400\\]\\/60');
      if (index === 0) {
        card.should('have.class', 'bg-[var(--primary-color)]');
      } else {
        card.should('have.class', 'bg-[#006400]/60');
      }
    });
  });

  it('should display plausible calculated values in metric cards', () => {
    cy.contains('Total food diverted (KGS)').parent().find('p.text-2xl').invoke('text').should('match', /^\d{1,3}(,\d{3})*$/);
    cy.contains('Revenue recovered (KSH)').parent().find('p.text-2xl').invoke('text').should('match', /^\d{1,3}(,\d{3})*$/);
    cy.contains('Carbon emissions saved (T)').parent().find('p.text-2xl').invoke('text').should('match', /^\d+\.\d+$/);
    cy.contains('Recycling partners').parent().find('p.text-2xl').invoke('text').should('match', /^\d+$/);
  });

  it('should display the impact chart', () => {
    cy.contains('h2', 'Impact Over Time').should('be.visible');
    cy.contains('h5', 'Food diverted').should('be.visible');
    cy.get('.recharts-wrapper').should('be.visible');
    cy.get('.recharts-bar-rectangle').should('have.length.greaterThan', 0);
  });

  it('should display all four sustainability badges', () => {
    cy.contains('h2', 'Sustainability badges').should('be.visible');
    const badgeTitles = ["Landfill Hero", "Hunger Hero", "Planet Hero", "Recycling Hero"];
    badgeTitles.forEach(title => {
      cy.contains('p', title).should('be.visible');
    });
  });

  it('should correctly show badge achievement status', () => {
    cy.get('[data-testid="check-icon"]').each(($checkIcon) => {
      const isAchieved = $checkIcon.hasClass('bg-emerald-600') || $checkIcon.hasClass('bg-amber-600') || $checkIcon.hasClass('bg-sky-600') || $checkIcon.hasClass('bg-purple-600');
      const progressBarSelector = '.bg-emerald-500, .bg-amber-500, .bg-sky-500, .bg-purple-500';
      const progressBar = cy.wrap($checkIcon.parent().find(progressBarSelector));

      if (isAchieved) {
        progressBar.should('have.attr', 'style', 'width: 100%;');
      } else {
        progressBar.should('not.have.attr', 'style', 'width: 100%;');
      }
    });
  });

  it('should display a loading state initially', () => {
    cy.intercept('GET', '**/api/orders', { delay: 1000 }).as('getSlowOrders');
    cy.visit('https://feedlink-one.vercel.app/dashboard');

    cy.contains('Loading dashboard...').should('be.visible');

    cy.wait('@getSlowOrders');

    cy.contains('Loading dashboard...').should('not.exist');
    cy.contains('h1', 'Dashboard Overview').should('be.visible');
  });
});