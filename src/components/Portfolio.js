import React from "react";
import Albums from "./Albums";

const rootFolderId = process.env.REACT_APP_PORTFOLIO_FOLDER_ID;

if (!rootFolderId) {
  console.error(
    "Missing required environment variable: REACT_APP_PORTFOLIO_FOLDER_ID"
  );
}

export default function Portfolio() {
  return (
    <div className="bodyDiv">
      <h1>Portefólio</h1>
      <Albums rootFolderId={rootFolderId} />
    </div>
  );
}
