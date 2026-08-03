import React, { createContext, useContext, useState } from 'react';

// No seeded customer. Nothing is "active" until an analyst selects one.
const CustomerContext = createContext({
  activeCustomerId: null,
  customerProfile: null,
  selectCustomer: () => {}
});

export function CustomerProvider({ children }) {
  const [activeCustomerId, setActiveCustomerId] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);

  const selectCustomer = (customerId, profile = null) => {
    setActiveCustomerId(customerId);
    setCustomerProfile(profile);
  };

  return (
    <CustomerContext.Provider value={{ activeCustomerId, customerProfile, selectCustomer }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  return useContext(CustomerContext);
}
