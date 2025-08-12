import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Text, Button, Card, Image, Skeleton, Box } from "@chakra-ui/react";

export default function Home() {
  return (
    <div>
      <div id="coverDiv">
        <img src="/photos/cover.jpg" alt="Home" id="coverImg" />
        <p>SARA FERREIRA</p>
      </div>
    </div>
  );
}
