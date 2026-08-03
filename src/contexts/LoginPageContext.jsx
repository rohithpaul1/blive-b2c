import { createContext, useState } from "react";

const LoginPageContext = createContext();

const LoginPageProvider = ({ children }) => {
  const [showLoginPage, setShowLoginPage] = useState(false);

  return (
    <LoginPageContext.Provider value={{ showLoginPage, setShowLoginPage }}>
      {children}
    </LoginPageContext.Provider>
  );
};

export { LoginPageContext, LoginPageProvider };