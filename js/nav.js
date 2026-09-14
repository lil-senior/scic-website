/* ============================================
   SCIC — Navigation & Footer HTML inject
   ============================================ */

const SCIC_NAV = `
<nav id="navbar">
  <div class="container nav-inner">
    <a href="index.html" class="nav-logo">
      <img src="images/SCIC_horizontal.png" alt="Stephenson Cardiac Imaging Centre">
    </a>
    <ul class="nav-links">
      <li><a href="index.html">Home</a></li>
      <li class="dropdown">
        <button>About ▾</button>
        <div class="dropdown-menu">
          <a href="about.html#history">Our History</a>
          <a href="about.html#team">Our Team</a>
        </div>
      </li>
      <li class="dropdown">
        <button>Research ▾</button>
        <div class="dropdown-menu">
          <a href="research.html">Research Overview</a>
          <a href="icmr.html">iCMR Programme</a>
        </div>
      </li>
      <li><a href="education.html">Education</a></li>
      <li><a href="patients.html">For Patients</a></li>
      <li class="dropdown">
        <button>Support ▾</button>
        <div class="dropdown-menu">
          <a href="donors.html">Donate</a>
          <a href="investors.html">Investors & Partners</a>
        </div>
      </li>
      <li><a href="contact.html">Contact</a></li>
      <li><a href="news.html">News</a></li>
      </ul>
    <button class="nav-hamburger" aria-label="Open menu">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>

<div class="mobile-menu">
  <button class="mobile-close" aria-label="Close menu">✕</button>
  <a href="index.html">Home</a>
  <a href="about.html">About</a>
  <a href="research.html">Research</a>
  <a href="icmr.html">iCMR</a>
  <a href="education.html">Education</a>
  <a href="patients.html">For Patients</a>
  <a href="donors.html">Donate</a>
  <a href="investors.html">Investors</a>
  <a href="contact.html">Contact</a>
  <a href="news.html">News</a>
  </div>
`;

const SCIC_FOOTER = `
<footer id="footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <div class="footer-logo">
          <img src="images/SCIC_horizontal.png" alt="SCIC Logo">
        </div>
        <p class="footer-desc">Advancing cardiac imaging through innovation, excellence in clinical care, and transformative research.</p>
        <div class="footer-social mt-4">
          <a href="#" aria-label="Twitter">𝕏</a>
          <a href="https://www.linkedin.com/company/stephenson-cardiac-imaging-centre/" aria-label="LinkedIn">in</a>
        </div>
      </div>
      <div>
        <h5>About</h5>
        <ul>
          <li><a href="about.html#history">Our History</a></li>
          <li><a href="about.html#team">Our Team</a></li>
          <li><a href="news.html">News</a></li>
        </ul>
      </div>
      <div>
        <h5>Patients & Professionals</h5>
        <ul>
          <li><a href="research.html">Research</a></li>
          <li><a href="icmr.html">iCMR Programme</a></li>
          <li><a href="education.html">Education & Fellowship</a></li>
          <li><a href="patients.html">For Patients</a></li>
        </ul>
      </div>
      <div>
        <h5>Get Involved</h5>
        <ul>
          <li><a href="donors.html">Donate</a></li>
          <li><a href="investors.html">Investors & Partners</a></li>
          <li><a href="education.html#apply">Apply for Fellowship</a></li>
          <li><a href="contact.html">Contact Us</a></li>
        </ul>
        <div class="mt-4">
          <p style="font-size:0.85rem;color:rgba(255,255,255,0.4);">Foothills Medical Centre<br>Calgary, Alberta, Canada</p>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; 2025 Stephenson Cardiac Imaging Centre. All rights reserved.</span>
      <span>Affiliated with University of Calgary & Alberta Health Services</span>
    </div>
  </div>
</footer>
`;

// Inject nav & footer
document.addEventListener('DOMContentLoaded', () => {
  const navHolder = document.getElementById('nav-holder');
  if (navHolder) navHolder.innerHTML = SCIC_NAV;

  const footerHolder = document.getElementById('footer-holder');
  if (footerHolder) footerHolder.innerHTML = SCIC_FOOTER;

});
