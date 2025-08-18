import React, { useEffect, useState } from "react";

export default function Home() {
  const [imgError, setImgError] = useState(false);
  const driveCover =
    "https://drive.google.com/uc?export=view&id=1a6_3a5_K7io2ohmIHQo0U3BzP7Rvh73T";
  const localCover = "/photos/cover.jpg";
  return (
    <div className="homeViewport">
      <div id="coverDiv">
        <img
          src={imgError ? localCover : driveCover}
          alt="image"
          id="coverImg"
          onError={() => setImgError(true)}
        />
        <p>SARA FERREIRA</p>
      </div>
    </div>
  );
}
