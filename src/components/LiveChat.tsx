import React, { useEffect } from 'react';

// TypeScript declarations for Tawk.to API
declare global {
  interface Window {
    Tawk_API?: {
      onLoad: () => void;
      setAttributes: (attributes: { name: string; email: string; role: string }) => void;
      sendMessage: (message: string) => void;
      showWidget: () => void;
      hideWidget: () => void;
      toggleVisibility: () => void;
    };
  }
}

const LiveChat: React.FC = () => {
  // Welcome message options
  const welcomeMessages = React.useMemo(() => [
    "Hello! 👋 Welcome to Global Track! I'm here to help you with your shipment tracking, delivery questions, or any other inquiries. How can I assist you today?",
    "Hi there! 🚚 Welcome to Global Track! Need help tracking your shipment or have questions about delivery? I'm here to help!",
    "Welcome to Global Track! 📦 I'm your shipping assistant. I can help you track packages, check delivery status, or answer any shipping questions. What can I help you with?",
    "Hello! 🎉 Thanks for visiting Global Track! I'm here to make your shipping experience smooth and easy. How can I assist you today?"
  ], []);

  // Suggested quick reply buttons
  const quickReplies = React.useMemo(() => [
    "Track My Package",
    "Check Delivery Status", 
    "Shipping Rates",
    "File a Claim",
    "Contact Support"
  ], []);

  // Get random welcome message
  const getRandomWelcomeMessage = React.useCallback(() => {
    return welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
  }, [welcomeMessages]);

  // Add quick reply buttons after welcome message
  const addQuickReplies = React.useCallback(() => {
    if (window.Tawk_API) {
      setTimeout(() => {
        // Add quick reply buttons
        quickReplies.forEach((reply, index) => {
          setTimeout(() => {
            window.Tawk_API?.sendMessage(`[Quick Reply ${index + 1}] ${reply}`);
          }, (index + 1) * 500); // Stagger the buttons
        });
      }, 2000); // Show after welcome message
    }
  }, [quickReplies]);

  useEffect(() => {
    // Remove any existing Tawk.to script to avoid duplicates
    const existingScript = document.querySelector('script[src*="tawk.to"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Load Tawk.to script using the provided script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://embed.tawk.to/68b823c181805619277a1df5/1j47knbl1';
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    
    script.onload = () => {
      // Wait a bit for Tawk_API to be available
      setTimeout(() => {
        if (window.Tawk_API) {
          // Set welcome message
          window.Tawk_API.onLoad = function() {
            try {
              // Set visitor attributes
              window.Tawk_API?.setAttributes({
                'name': 'Global Track Customer',
                'email': '',
                'role': 'customer'
              });
              
              // Send welcome message with slight delay for better UX
              setTimeout(() => {
                window.Tawk_API?.sendMessage(getRandomWelcomeMessage());
                // Add quick reply buttons after welcome message
                addQuickReplies();
              }, 1000);
            } catch (error) {
              console.error('Error setting up Tawk.to:', error);
            }
          };
        }
      }, 1000);
    };
    
    script.onerror = (error) => {
      console.error('Failed to load Tawk.to script:', error);
    };
    
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      const existing = document.querySelector('script[src*="tawk.to"]');
      if (existing) {
        existing.remove();
      }
    };
  }, [addQuickReplies, getRandomWelcomeMessage]);

  // Return null since we're using Tawk.to's built-in widget
  return null;
};

export default LiveChat;
