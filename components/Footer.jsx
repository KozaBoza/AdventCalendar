// src/components/Footer.jsx
const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="about-me">
        <h3>About Me</h3>
        <p>
          Hi, I'm [Your Name]. I love building tiny, whimsical tools that make people smile.
          This project was inspired by the joy of giving.
        </p>
      </div>
      
      <div className="social-links">
        <a href="https://instagram.com/yourhandle" target="_blank" rel="noreferrer">Instagram</a>
        <span> • </span>
        <a href="https://tiktok.com/@yourhandle" target="_blank" rel="noreferrer">TikTok</a>
        <span> • </span>
        <a href="https://youtube.com/c/yourhandle" target="_blank" rel="noreferrer">YouTube</a>
      </div>

      <div className="copyright">
        <p>© 2024 Your Creative Studio. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;