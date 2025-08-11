import React from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Gallery from "./components/Gallery";
import Sessions from "./components/Sessions";
import Nav from "./components/Nav";
import About from "./components/About";
import Contacts from "./components/Contacts.js";
import Portfolio from "./components/Portfolio.js";
import Orders from "./components/Orders.js";
import { Provider } from "./components/ui/provider.jsx";

export default function App() {
  return (
    <Provider>
      <Router>
        <Nav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/gallery/:folderId/:folderName" element={<Gallery />} />
          <Route path="/about" element={<About />} />
          {/* <Route path="/contacts" element={<Contacts />} /> */}
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </Router>
    </Provider>
  );
}
