import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Text, Button, Card, Image, Skeleton, Box } from "@chakra-ui/react";

const apiKey = "AIzaSyBrPePe8ZoK2i4CUwG3BwQYuCVtUeaoxkU";
const rootFolderId = "1CF4mVPyqLISvgLHEzpPOCPfX4DQrXJsF";

export default function Home() {
  return (
    <div>
      <div id="coverDiv">
        <img
          src="https://images.unsplash.com/photo-1602781723875-7e7edaa1e5ca?q=80&w=2099&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Home"
          id="coverImg"
        />
        <p>SARA FERREIRA</p>
      </div>
    </div>
  );
}
