import React from "react";
import "./App.css";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./components/Home";
import Gallery from "./components/Gallery";
import Sessions from "./components/Sessions";
import Nav from "./components/Nav";
import Start from "./components/Start";
import About from "./components/About";
import Contacts from "./components/Contacts.js";
import Portfolio from "./components/Portfolio.js";
import Orders from "./components/Orders.js";
import { Provider } from "./components/ui/provider.jsx";

export default function App() {
  const location = useLocation();
  const hideNavOn = ["/"];

  return (
    <Provider>
      {!hideNavOn.includes(location.pathname) && <Nav />}
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/home" element={<Home />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/gallery/:folderId/:folderName" element={<Gallery />} />
        <Route path="/about" element={<About />} />
        {/* <Route path="/contacts" element={<Contacts />} /> */}
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/orders" element={<Orders />} />
      </Routes>
    </Provider>
  );
}
