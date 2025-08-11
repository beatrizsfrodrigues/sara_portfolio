import React from "react";
import Albums from "./Albums";

const rootFolderId = process.env.REACT_APP_ORDERS_FOLDER_ID;

if (!rootFolderId) {
  console.error(
    "Missing required environment variable: REACT_APP_ORDERS_FOLDER_ID"
  );
}

export default function Orders() {
  return (
    <div className="bodyDiv">
      <h1>Encomendas</h1>
      <Albums rootFolderId={rootFolderId} download={true} lock={false} />
    </div>
  );
}
