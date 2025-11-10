import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ComponentStore.css';

const ComponentStore = ({ components, initialBalance, onPurchaseComplete }) => {
  const [balance, setBalance] = useState(initialBalance);
  const [cart, setCart] = useState([]);
  const [purchasedComponents, setPurchasedComponents] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  const addToCart = (component) => {
    if (purchasedComponents.length + cart.length >= 6) {
      setWarningMessage('⚠️ Maximum 6 components allowed!');
      setTimeout(() => setWarningMessage(''), 3000);
      return;
    }

    if (cart.find(item => item.code === component.code)) {
      setWarningMessage('⚠️ Component already in cart!');
      setTimeout(() => setWarningMessage(''), 3000);
      return;
    }

    if (purchasedComponents.find(item => item.code === component.code)) {
      setWarningMessage('⚠️ Component already purchased!');
      setTimeout(() => setWarningMessage(''), 3000);
      return;
    }

    const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
    if (cartTotal + component.price > balance) {
      setWarningMessage('⚠️ Insufficient balance!');
      setTimeout(() => setWarningMessage(''), 3000);
      return;
    }

    setCart([...cart, component]);
    setWarningMessage('');
  };

  const removeFromCart = (componentCode) => {
    setCart(cart.filter(item => item.code !== componentCode));
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      setWarningMessage('⚠️ Cart is empty!');
      setTimeout(() => setWarningMessage(''), 3000);
      return;
    }

    // Validate that we have exactly 6 components for first purchase
    const totalComponents = purchasedComponents.length + cart.length;
    
    if (purchasedComponents.length === 0 && totalComponents !== 6) {
      setWarningMessage(`⚠️ You must purchase exactly 6 components for initial purchase! Currently: ${totalComponents}`);
      setTimeout(() => setWarningMessage(''), 3000);
      return;
    }

    const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
    const newBalance = balance - cartTotal;
    
    setBalance(newBalance);
    setPurchasedComponents([...purchasedComponents, ...cart]);
    const allComponents = [...purchasedComponents, ...cart];
    setCart([]);
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);

    // Submit purchase to backend
    setTimeout(() => {
      onPurchaseComplete({
        components: allComponents,
        remainingBalance: newBalance,
        totalSpent: initialBalance - newBalance
      });
    }, 2000);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
  const totalPurchased = purchasedComponents.length;
  const isFirstPurchase = purchasedComponents.length === 0;

  return (
    <div className="component-store">
      {/* Header */}
      <div className="store-header">
        <div className="balance-display">
          <span className="balance-label">Available Balance</span>
          <span className="balance-amount">₹{balance}</span>
        </div>
        <div className="purchase-progress">
          <span className="progress-label">Components Selected</span>
          <span className="progress-count">
            {totalPurchased + cart.length} {isFirstPurchase ? '/ 6' : ''}
          </span>
        </div>
      </div>

      {/* Purchase Hint */}
      {isFirstPurchase && (
        <div className="purchase-hint">
          <div className="hint-icon">💡</div>
          <div className="hint-text">
            <strong>Important:</strong> Select exactly 6 components wisely! Once purchased, you cannot buy more. You'll arrange them in Round 2.
          </div>
        </div>
      )}

      {/* Warning Message */}
      <AnimatePresence>
        {warningMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="warning-message"
          >
            {warningMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Message */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="confirmation-message"
          >
            ✓ Purchase Successful! Components Added.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Component Grid */}
      <div className="components-grid">
        {components.map((component) => {
          const isInCart = cart.find(item => item.code === component.code);
          const isPurchased = purchasedComponents.find(item => item.code === component.code);
          const canAfford = cartTotal + component.price <= balance;

          return (
            <motion.div
              key={component.id}
              className={`component-card ${isPurchased ? 'purchased' : ''} ${isInCart ? 'in-cart' : ''} ${!canAfford && !isInCart && !isPurchased ? 'unaffordable' : ''}`}
              whileHover={{ y: isPurchased ? 0 : -4, scale: isPurchased ? 1 : 1.02 }}
              layout
            >
              <div className="component-header-section">
                <div className="component-icon">{component.icon}</div>
                <div className="component-info">
                  <h3 className="component-name">{component.name}</h3>
                  <div className="component-price-tag">₹{component.price}</div>
                </div>
              </div>
              
              <p className="component-description">{component.description}</p>
              
           

              <div className="component-actions">
                {isPurchased ? (
                  <button className="component-btn purchased-btn" disabled>
                    <span className="btn-icon">✓</span>
                    <span className="btn-text">Purchased</span>
                  </button>
                ) : isInCart ? (
                  <button
                    className="component-btn remove-btn"
                    onClick={() => removeFromCart(component.code)}
                  >
                    <span className="btn-icon">✕</span>
                  </button>
                ) : (
                  <button
                    className="component-btn add-btn"
                    onClick={() => addToCart(component)}
                    disabled={!canAfford || totalPurchased + cart.length >= 6}
                  >
                    <span className="btn-icon">+</span>
                    <span className="btn-text">Add</span>
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Cart Summary */}
      <div className={`cart-summary ${cart.length > 0 ? 'active' : ''}`}>
        <div className="cart-header">
          <h3>Shopping Cart ({cart.length} items)</h3>
          {cart.length > 0 && (
            <button className="clear-cart-btn" onClick={() => setCart([])}>
              Clear All
            </button>
          )}
        </div>

        {cart.length > 0 ? (
          <>
            <div className="cart-items">
              {cart.map((item) => (
                <div key={item.code} className="cart-item">
                  <span className="cart-item-icon">{item.icon}</span>
                  <span className="cart-item-name">{item.name}</span>
                  <span className="cart-item-price">₹{item.price}</span>
                  <button
                    className="cart-item-remove"
                    onClick={() => removeFromCart(item.code)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-total">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>₹{cartTotal}</span>
              </div>
              <div className="total-row">
                <span>Current Balance:</span>
                <span>₹{balance}</span>
              </div>
              <div className="total-row final">
                <span>Balance After Purchase:</span>
                <span className="highlight">₹{balance - cartTotal}</span>
              </div>
            </div>

            <button className="checkout-btn" onClick={handleCheckout}>
              Complete Purchase
            </button>

            <div className="cart-warning">
              ⚠️ Warning: Dropping purchased components later will NOT refund the money!
            </div>
          </>
        ) : (
          <div className="empty-cart">
            <p>Your cart is empty. Add components to get started!</p>
          </div>
        )}
      </div>

      {/* Purchased Components */}
      {purchasedComponents.length > 0 && (
        <div className="purchased-section">
          <h3>Your Purchased Components ({purchasedComponents.length}/6)</h3>
          <div className="purchased-list">
            {purchasedComponents.map((item) => (
              <div key={item.code} className="purchased-item">
                <span className="purchased-icon">{item.icon}</span>
                <span className="purchased-name">{item.name}</span>
                <span className="purchased-price">₹{item.price}</span>
              </div>
            ))}
          </div>
          
          {purchasedComponents.length === 6 && (
            <div className="completion-message">
              🎉 All 6 components purchased! Ready for Round 2.
              <br />
              <strong>Round 1 Score: ₹{balance}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ComponentStore;
