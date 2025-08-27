import React, { useEffect, useState } from "react";

export default function Home() {
  const driveCover =
    "https://drive.google.com/uc?export=view&id=1a6_3a5_K7io2ohmIHQo0U3BzP7Rvh73T";
  const localCover = "/photos/cover.jpg";
  const [imgSrc, setImgSrc] = useState(localCover);
  const [driveLoaded, setDriveLoaded] = useState(false);

  useEffect(() => {
    // Try to load the drive image in the background
    const img = new window.Image();
    img.src = driveCover;
    img.onload = () => {
      setImgSrc(driveCover);
      setDriveLoaded(true);
    };
    // If drive image fails, do nothing (keep local)
  }, []);

  return (
    <div className="homeViewport">
      <div id="coverDiv">
        <img src={imgSrc} alt="image" id="coverImg" />
        <p>SARA FERREIRA</p>
      </div>
    </div>
  );
}
