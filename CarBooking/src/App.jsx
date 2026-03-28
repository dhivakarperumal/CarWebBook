import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";


import ScrollToTop from "./Components/ScrollToTop";
import ScrollNavigator from "./Components/ScrollNavigator";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";

function App() {
  const location = useLocation();

  // 🔐 Hide layout on auth pages
  const hideLayout = ["/login", "/register"].includes(location.pathname);




  // 3️⃣ MAIN WEBSITE
  return (
    <section>
      
      <Navbar/>
      <ScrollToTop />
      <ScrollNavigator />
      
      <Outlet />
      <Footer/>
      {!hideLayout }
    </section>
  );
}

export default App;