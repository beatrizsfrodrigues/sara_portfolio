import React, { useEffect, useState } from "react";
import { Button } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

async function fetchRemoteImages(folderId) {
  const apiKey = process.env.REACT_APP_API_KEY;
  if (!apiKey || !folderId) return [];
  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType+contains+'image/'&fields=files(id%2Cname)&key=${apiKey}`
    );
    if (!res.ok) throw new Error("Network error");
    const data = await res.json();
    if (!data.files || !Array.isArray(data.files)) return [];
    // Map to { src, name }
    return data.files.map((file) => ({
      src: `https://drive.google.com/thumbnail?sz=w400&id=${file.id}`,
      name: file.name,
    }));
  } catch (e) {
    return [];
  }
}

function Start() {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadImages() {
      setLoading(true);
      const folderId = process.env.REACT_APP_MASONRY_FOLDER_ID;
      let remoteImages = [];
      if (folderId) {
        remoteImages = await fetchRemoteImages(folderId);
      }
      if (remoteImages && remoteImages.length > 0) {
        setImages(remoteImages);
      } else {
        function importAll(r) {
          return r.keys().map((fileName) => ({
            src: r(fileName),
            name: fileName.replace("./", ""),
          }));
        }
        const imported = importAll(
          require.context("../assets/masonry", false, /\.(png|jpe?g|svg)$/)
        );
        setImages(imported);
      }
      setLoading(false);
    }
    loadImages();
  }, []);

  return (
    <div className="homeViewport">
      <div id="home">
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <div
              className="spinner"
              style={{
                width: 60,
                height: 60,
                border: "6px solid #ccc",
                borderTop: "6px solid #333",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div className="masonryGrid">
            {images.map((img, i) => (
              <React.Fragment key={i}>
                <img src={img.src} alt={img.name} className="masonryImage" />
                {i === Math.floor(images.length / 2 + 2) && (
                  <Button
                    colorPalette="gray"
                    variant="solid"
                    className="centerBtn"
                    onClick={() => navigate("/home")}
                  >
                    ENTRAR
                  </Button>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Start;
