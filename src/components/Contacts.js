import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Text, Button, Card, Image, Skeleton, Box } from "@chakra-ui/react";

const apiKey = "AIzaSyBrPePe8ZoK2i4CUwG3BwQYuCVtUeaoxkU";
const rootFolderId = "1CF4mVPyqLISvgLHEzpPOCPfX4DQrXJsF";

export default function Contacts() {
  return (
    <div className="bodyDiv">
      <h1>Contactos</h1>
      <p>
        Telemóvel: +351 915 370 827 email: ssaras.photos@gmail.com Instagram
        sara._.photos
      </p>
    </div>
  );
}
