import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Image, Skeleton, Box, Dialog } from "@chakra-ui/react";

const apiKey = process.env.REACT_APP_API_KEY;

if (!apiKey) {
  console.error("Missing required environment variable: REACT_APP_API_KEY");
}

export default function Gallery() {
  const { folderId } = useParams();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [modalImageLoading, setModalImageLoading] = useState(true);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const handleImageClick = (image) => {
    console.log("Image clicked:", image.name); // Debug log
    setSelectedImage(image);
    setIsOpen(true);
    setModalImageLoading(true); // Reset loading state for new image
    console.log("Dialog should open, isOpen will be:", true); // Debug log
  };

  const onClose = () => {
    setIsOpen(false);
    setSelectedImage(null);
    setModalImageLoading(true);
  };

  useEffect(() => {
    async function fetchImages() {
      setLoading(true);
      setImages([]);
      setNextPageToken(null);
      setHasMore(true);

      try {
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType+contains+'image/'&pageSize=100&key=${apiKey}`
        );
        const data = await res.json();
        const files = data.files || [];

        setImages(files);
        setNextPageToken(data.nextPageToken || null);
        setHasMore(!!data.nextPageToken);

        console.log(`Loaded ${files.length} images from folder`);
      } catch (error) {
        console.error("Erro ao buscar imagens:", error);
      }
      setLoading(false);
    }

    fetchImages();
  }, [folderId]);

  const loadMoreImages = async () => {
    if (!nextPageToken || loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType+contains+'image/'&pageSize=100&pageToken=${nextPageToken}&key=${apiKey}`
      );
      const data = await res.json();
      const newFiles = data.files || [];

      setImages((prev) => [...prev, ...newFiles]);
      setNextPageToken(data.nextPageToken || null);
      setHasMore(!!data.nextPageToken);

      console.log(`Loaded ${newFiles.length} more images`);
    } catch (error) {
      console.error("Erro ao buscar mais imagens:", error);
    }
    setLoadingMore(false);
  };

  const skeletonCount = 12; // You can adjust this number

  return (
    <div className="bodyDiv">
      <Link to="/sessions">← Voltar</Link>
      <h1>Galeria</h1>
      <div
        style={{
          columns: "300px",
          columnGap: "16px",
          columnFill: "balance",
        }}
      >
        {loading
          ? // Render skeleton placeholders while loading
            Array.from({ length: skeletonCount }).map((_, index) => (
              <Box
                key={index}
                style={{
                  breakInside: "avoid",
                  marginBottom: "16px",
                  display: "inline-block",
                  width: "100%",
                }}
              >
                <Skeleton height="200px" />
              </Box>
            ))
          : // Render the actual images after loading is complete
            images.map((img) => (
              <Box
                key={img.id}
                cursor="pointer"
                onClick={() => handleImageClick(img)}
                style={{
                  breakInside: "avoid",
                  marginBottom: "16px",
                  display: "inline-block",
                  width: "100%",
                }}
              >
                <Image
                  src={`https://drive.google.com/thumbnail?sz=w640&id=${img.id}`}
                  alt={img.name}
                  style={{ width: "100%", borderRadius: "8px" }}
                  objectFit="cover"
                  _hover={{
                    transform: "scale(1.05)",
                    transition: "transform 0.2s",
                  }}
                />
              </Box>
            ))}
      </div>

      {/* Load More Button */}
      {hasMore && !loading && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <button
            onClick={loadMoreImages}
            disabled={loadingMore}
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              backgroundColor: loadingMore ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: loadingMore ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
            }}
          >
            {loadingMore ? "Loading..." : "Load More Images"}
          </button>
        </div>
      )}

      {/* No more images message */}
      {!hasMore && images.length > 0 && !loading && (
        <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
          <p>All images loaded</p>
        </div>
      )}

      {/* Simple modal overlay for testing */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={onClose}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "rgba(0, 0, 0, 0.6)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "8px 12px",
                cursor: "pointer",
                zIndex: 1001,
              }}
            >
              ✕
            </button>
            {selectedImage && (
              <>
                {/* Loading placeholder */}
                {modalImageLoading && (
                  <Box
                    width="400px"
                    height="300px"
                    bg="gray.200"
                    borderRadius="8px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    position="relative"
                  >
                    <Skeleton width="100%" height="100%" borderRadius="8px" />
                    <div
                      style={{
                        position: "absolute",
                        color: "gray.600",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      Loading image...
                    </div>
                  </Box>
                )}
                {/* Actual image */}
                <img
                  src={`https://drive.google.com/thumbnail?sz=w1920&id=${selectedImage.id}`}
                  alt={selectedImage.name}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "90vh",
                    objectFit: "contain",
                    borderRadius: "8px",
                    display: modalImageLoading ? "none" : "block",
                  }}
                  onLoad={() => setModalImageLoading(false)}
                  onError={() => setModalImageLoading(false)}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Dialog for enlarged image */}
      <Dialog.Root
        open={false}
        onOpenChange={(details) => {
          console.log("Dialog onOpenChange:", details);
          if (!details.open) {
            onClose();
          }
        }}
        size="full"
      >
        <Dialog.Backdrop bg="blackAlpha.800" />
        <Dialog.Positioner>
          <Dialog.Content
            bg="transparent"
            boxShadow="none"
            maxW="90vw"
            maxH="90vh"
          >
            <Dialog.CloseTrigger
              color="white"
              bg="blackAlpha.600"
              _hover={{ bg: "blackAlpha.800" }}
              size="lg"
              position="absolute"
              top="4"
              right="4"
              zIndex={2}
            />
            <Dialog.Body p={0}>
              {selectedImage && (
                <Image
                  src={`https://drive.google.com/thumbnail?sz=w1920&id=${selectedImage.id}`}
                  alt={selectedImage.name}
                  maxW="100%"
                  maxH="90vh"
                  objectFit="contain"
                  borderRadius="8px"
                />
              )}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </div>
  );
}
