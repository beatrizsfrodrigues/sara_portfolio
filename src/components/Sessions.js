import React from "react";
import Albums from "./Albums";

const rootFolderId = process.env.REACT_APP_ROOT_FOLDER_ID;

if (!rootFolderId) {
  console.error(
    "Missing required environment variable: REACT_APP_ROOT_FOLDER_ID"
  );
}

export default function Sessions() {
  return (
    <div className="bodyDiv">
      <h1>Trabalhos Recentes</h1>
      <Albums rootFolderId={rootFolderId} lock={true} />
    </div>
  );
}
