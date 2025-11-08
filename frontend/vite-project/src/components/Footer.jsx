import { motion } from 'framer-motion';
import './Footer.css';

/**
 * Footer - Neurovia themed footer with animated glowing line
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();

  const linkVariants = {
    rest: { scale: 1, opacity: 0.8 },
    hover: {
      scale: 1.1,
      opacity: 1,
      transition: { duration: 0.2 },
    },
  };

  return (
    <footer className="footer">
      {/* Animated Glowing Line */}
      <div className="footer-glow-line"></div>

      <div className="footer-content">
        {/* Status Message */}
        <motion.div
          className="footer-status"
          initial={{ opacity: 0.7 }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <span className="status-dot"></span>
          Signal Stable. Awaiting next data packet…
        </motion.div>

        {/* Links */}
        <div className="footer-links">
         

          <motion.a
            href="https://ieee.org"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
            variants={linkVariants}
            initial="rest"
            whileHover="hover"
            aria-label="IEEE"
          >
            <span className="ieee-logo">IEEE</span>
          </motion.a>

        
        </div>

        {/* Copyright */}
        <div className="footer-copyright">
          <p>
            © {currentYear} TechSymphony: Reboot Neurovia | IEEE NIE South Campus
          </p>
          <p className="footer-tagline">
            Restoring the future, one circuit at a time.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
