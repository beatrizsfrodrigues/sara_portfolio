import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button, Image, Skeleton, Box, Dialog } from "@chakra-ui/react";
import { IoChevronBackOutline } from "react-icons/io5";

const apiKey = process.env.REACT_APP_API_KEY;

if (!apiKey) {
  console.error("Missing required environment variable: REACT_APP_API_KEY");
}

// Utility function to add delay between requests
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Request queue to throttle image loading
class RequestQueue {
  constructor(concurrency = 3) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        fn,
        resolve,
        reject,
      });
      this.process();
    });
  }

  async process() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { fn, resolve, reject } = this.queue.shift();

    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.process();
    }
  }
}

const imageQueue = new RequestQueue(3); // Limit to 3 concurrent image requests
const downloadQueue = new RequestQueue(1); // Limit to 1 concurrent download to avoid rate limiting

// Utility function to retry requests with exponential backoff
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delayTime = baseDelay * Math.pow(2, i);
      console.log(`Request failed, retrying in ${delayTime}ms...`);
      await delay(delayTime);
    }
  }
};

// Custom Image Component with error handling and retry logic
const ImageWithRetry = ({
  src,
  alt,
  style,
  objectFit,
  _hover,
  onError,
  onLoad,
  onClick,
  onErrorCount,
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  const handleImageError = async () => {
    console.log(`Image failed to load: ${src}, retry count: ${retryCount}`);

    if (retryCount < maxRetries) {
      // Exponential backoff with longer delays to be more conservative
      const delayTime = 2000 * Math.pow(2, retryCount); // 2s, 4s, 8s
      await delay(delayTime);
      setRetryCount((prev) => prev + 1);
      // Force reload by adding timestamp
      setImageSrc(`${src}&t=${Date.now()}`);
    } else {
      setHasError(true);
      if (onErrorCount) onErrorCount();
      if (onError) onError();
    }
  };

  const handleImageLoad = () => {
    setHasError(false);
    setRetryCount(0);
    if (onLoad) onLoad();
  };

  if (hasError) {
    return (
      <Box
        style={style}
        bg="gray.100"
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="8px"
        cursor={onClick ? "pointer" : "default"}
        onClick={onClick}
      >
        <div style={{ textAlign: "center", color: "#666", padding: "20px" }}>
          <div>🖼️</div>
          <div style={{ fontSize: "12px", marginTop: "8px" }}>
            Imagem não disponível
          </div>
        </div>
      </Box>
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      style={style}
      objectFit={objectFit}
      _hover={_hover}
      onError={handleImageError}
      onLoad={handleImageLoad}
      onClick={onClick}
    />
  );
};

export default function Gallery() {
  const { folderId, folderName } = useParams();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [modalImageLoading, setModalImageLoading] = useState(true);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [errorCount, setErrorCount] = useState(0);

  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState("");

  // Download availability state
  const [downloadEnabled, setDownloadEnabled] = useState(false);

  // Decode the folder name from URL
  const decodedFolderName = folderName
    ? decodeURIComponent(folderName)
    : "Gallery";

  const handleImageClick = (image) => {
    // Prevent double clicks
    if (isOpen) return;

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

  // Function to handle image download with rate limiting and fallbacks
  const handleDownload = async (img, e) => {
    e.stopPropagation(); // Prevent triggering the image modal

    // Show loading state
    const button = e.target;
    const originalText = button.textContent;
    button.textContent = "A transferir...";
    button.disabled = true;

    try {
      // Use download queue to limit concurrent downloads
      await downloadQueue.add(async () => {
        // Try different download methods in order of preference
        const downloadMethods = [
          // Method 1: Try the API endpoint with authentication
          async () => {
            const response = await fetch(
              `https://www.googleapis.com/drive/v3/files/${img.id}?alt=media&key=${apiKey}`
            );
            if (response.status === 429) throw new Error("Rate limited");
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response;
          },
          // Method 2: Try the thumbnail endpoint with high resolution
          async () => {
            await delay(1000); // Wait 1 second to avoid rate limiting
            const response = await fetch(
              `https://drive.google.com/thumbnail?sz=w2000&id=${img.id}`
            );
            if (response.status === 429) throw new Error("Rate limited");
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response;
          },
        ];

        let response = null;
        let lastError = null;

        // Try each method
        for (const method of downloadMethods) {
          try {
            response = await method();
            break; // Success, exit the loop
          } catch (error) {
            lastError = error;
            console.log(`Download method failed: ${error.message}`);
            continue;
          }
        }

        if (!response) {
          throw lastError || new Error("All download methods failed");
        }

        // Get the image blob
        const blob = await response.blob();

        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        // Set filename - keep original extension or add .jpg
        let filename = img.name;
        if (!filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          filename = filename.replace(/\.[^/.]+$/, "") + ".jpg";
        }
        link.download = filename;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      });

      // Success feedback
      button.textContent = "✅ Transferido";
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
    } catch (error) {
      console.error("Download failed:", error);

      // Reset button state
      button.textContent = originalText;
      button.disabled = false;

      // Check if it's a rate limiting issue
      if (
        error.message.includes("Rate limited") ||
        error.message.includes("429")
      ) {
        // Fallback: open in Google Drive
        const fallbackUrl = `https://drive.google.com/file/d/${img.id}/view`;
        window.open(fallbackUrl, "_blank");
        alert(
          "Muitas transferências simultâneas. A abrir no Google Drive numa nova aba onde pode fazer download diretamente."
        );
      } else {
        // For other errors, also fallback to Google Drive
        const fallbackUrl = `https://drive.google.com/file/d/${img.id}/view`;
        window.open(fallbackUrl, "_blank");
        alert(
          "Transferência direta não disponível. A abrir no Google Drive numa nova aba."
        );
      }
    }
  };

  // Function to check if folder has password.txt file
  const checkPasswordProtection = async () => {
    try {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+name='password.txt'&key=${apiKey}`
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      return data.files && data.files.length > 0;
    } catch (error) {
      console.error("Error checking password protection:", error);
      return false;
    }
  };

  // Function to check if folder has download.txt file with "true" content
  const checkDownloadAvailability = async () => {
    try {
      // First, check if download.txt file exists
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+name='download.txt'&key=${apiKey}`
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();

      if (data.files && data.files.length > 0) {
        // File exists, now get its content
        const fileId = data.files[0].id;
        const contentRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`
        );

        if (contentRes.ok) {
          const content = await contentRes.text();
          // Check if content is "true" (case insensitive, ignoring all whitespace)
          return content.replace(/\s+/g, "").toLowerCase() === "true";
        }
      }

      return false;
    } catch (error) {
      console.error("Error checking download availability:", error);
      return false;
    }
  };

  // Function to validate authentication using sessionStorage
  const validateAuthToken = async () => {
    setCheckingAuth(true);

    // Check sessionStorage for authentication
    const authDataStr = sessionStorage.getItem(`gallery_auth_${folderId}`);

    if (!authDataStr) {
      // No auth data in sessionStorage, check if folder is password protected
      const isProtected = await checkPasswordProtection();

      if (isProtected) {
        setAuthError(
          "Este album requer autenticação. Por favor, aceda através da página de sessões."
        );
        setIsAuthenticated(false);
      } else {
        // Not protected, allow access
        setIsAuthenticated(true);
      }
    } else {
      try {
        const authData = JSON.parse(authDataStr);

        // Check if auth data is for this folder
        if (authData.folderId !== folderId) {
          setAuthError("Dados de autenticação inválidos para esta galeria.");
          setIsAuthenticated(false);
        } else if (authData.isPublic) {
          // Public folder, allow access
          setIsAuthenticated(true);
        } else if (authData.authenticated) {
          // Check if session is not too old (24 hours)
          const sessionAge = Date.now() - authData.timestamp;
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours

          if (sessionAge > maxAge) {
            setAuthError(
              "A sessão expirou. Por favor, autentique-se novamente."
            );
            setIsAuthenticated(false);
            // Clear expired session
            sessionStorage.removeItem(`gallery_auth_${folderId}`);
          } else {
            setIsAuthenticated(true);
          }
        } else {
          setAuthError("Dados de autenticação inválidos.");
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error validating auth data:", error);
        setAuthError("Erro ao validar autenticação.");
        setIsAuthenticated(false);
        // Clear invalid session data
        sessionStorage.removeItem(`gallery_auth_${folderId}`);
      }
    }

    // Check download availability regardless of authentication status
    const downloadAvailable = await checkDownloadAvailability();
    setDownloadEnabled(downloadAvailable);

    setCheckingAuth(false);
  };

  useEffect(() => {
    // First validate authentication, then fetch images
    validateAuthToken();
  }, [folderId]);

  useEffect(() => {
    // Only fetch images if authenticated
    if (isAuthenticated && !checkingAuth) {
      fetchImages();
    }
  }, [isAuthenticated, checkingAuth]);

  async function fetchImages() {
    setLoading(true);
    setImages([]);
    setNextPageToken(null);
    setHasMore(true);

    try {
      const fetchData = async () => {
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType+contains+'image/'&pageSize=50&key=${apiKey}`
        );

        if (res.status === 429) {
          throw new Error("Rate limit exceeded");
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        return await res.json();
      };

      const data = await retryWithBackoff(fetchData);
      const files = data.files || [];

      setImages(files);
      setNextPageToken(data.nextPageToken || null);
      setHasMore(!!data.nextPageToken);

      console.log(`Loaded ${files.length} images from folder`);
    } catch (error) {
      console.error("Erro ao buscar imagens:", error);
      // Set empty state if fetch fails
      setImages([]);
      setHasMore(false);
    }
    setLoading(false);
  }

  const loadMoreImages = async () => {
    if (!nextPageToken || loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const fetchData = async () => {
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType+contains+'image/'&pageSize=50&pageToken=${nextPageToken}&key=${apiKey}`
        );

        if (res.status === 429) {
          throw new Error("Rate limit exceeded");
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        return await res.json();
      };

      const data = await retryWithBackoff(fetchData);
      const newFiles = data.files || [];

      setImages((prev) => [...prev, ...newFiles]);
      setNextPageToken(data.nextPageToken || null);
      setHasMore(!!data.nextPageToken);

      console.log(`Loaded ${newFiles.length} more images`);
    } catch (error) {
      console.error("Erro ao buscar mais imagens:", error);
      // Don't update state if load more fails, just log the error
    }
    setLoadingMore(false);
  };

  const skeletonCount = 12; // You can adjust this number

  return (
    <div className="bodyDiv">
      <Link to="/sessions">
        <Button colorPalette="teal" variant="solid">
          <IoChevronBackOutline /> Voltar
        </Button>
      </Link>
      <h1>{decodedFolderName}</h1>

      {/* Authentication checking */}
      {checkingAuth && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            margin: "20px 0",
          }}
        >
          <Skeleton height="20px" width="200px" margin="0 auto" />
          <p style={{ marginTop: "16px", color: "#666" }}>
            A verificar autenticação...
          </p>
        </div>
      )}

      {/* Authentication error */}
      {!checkingAuth && !isAuthenticated && (
        <div
          style={{
            maxWidth: "500px",
            margin: "40px auto",
            padding: "30px",
            backgroundColor: "#fff3cd",
            borderRadius: "12px",
            textAlign: "center",
            border: "1px solid #ffeaa7",
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
            <h2 style={{ margin: "0 0 8px 0", color: "#856404" }}>
              Acesso Restrito
            </h2>
            <p style={{ color: "#856404", fontSize: "14px", margin: "16px 0" }}>
              {authError}
            </p>
          </div>

          <Button
            colorPalette="yellow"
            variant="solid"
            onClick={() => navigate("/sessions")}
          >
            Voltar às Sessões
          </Button>
        </div>
      )}

      {/* Gallery Content - only show if authenticated */}
      {!checkingAuth && isAuthenticated && (
        <>
          {/* Status indicator */}
          {errorCount > 0 && (
            <div
              style={{
                backgroundColor: "#fff3cd",
                color: "#856404",
                padding: "10px",
                borderRadius: "4px",
                marginBottom: "16px",
                fontSize: "14px",
              }}
            >
              ⚠️ Algumas imagens podem demorar a carregar devido a limitações do
              servidor.
              {errorCount > 5 &&
                " Muitas imagens falharam - tente recarregar a página em alguns minutos."}
            </div>
          )}

          <div className="galleryGrid">
            {loading
              ? // Render skeleton placeholders while loading
                Array.from({ length: skeletonCount }).map((_, index) => (
                  <Box key={index}>
                    <Skeleton height="200px" />
                  </Box>
                ))
              : // Render the actual images after loading is complete
                images.map((img) => (
                  <Box
                    key={img.id}
                    cursor="pointer"
                    position="relative"
                    onClick={() => handleImageClick(img)}
                  >
                    <ImageWithRetry
                      src={`https://drive.google.com/thumbnail?sz=w400&id=${img.id}`}
                      alt={img.name}
                      style={{
                        width: "100%",
                        height: "20vh",
                        borderRadius: "8px",
                      }}
                      objectFit="cover"
                      _hover={{
                        transform: "scale(1.05)",
                        transition: "transform 0.2s",
                      }}
                      onClick={() => handleImageClick(img)}
                      onErrorCount={() => setErrorCount((prev) => prev + 1)}
                    />
                    <p>{img.name}</p>
                    {downloadEnabled && (
                      <button
                        onClick={(e) => handleDownload(img, e)}
                        style={{
                          position: "absolute",
                          bottom: "40px",
                          right: "10px",
                          backgroundColor: "rgba(0, 0, 0, 0.7)",
                          color: "white",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: "none",
                          fontSize: "12px",
                          fontWeight: "500",
                          cursor: "pointer",
                          transition: "background-color 0.2s",
                          zIndex: 10,
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
                        }}
                      >
                        ⬇️ Download
                      </button>
                    )}
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
                {loadingMore ? "A carregar..." : "Carregar mais imagens"}
              </button>
            </div>
          )}

          {/* No more images message */}
          {!hasMore && images.length > 0 && !loading && (
            <div
              style={{ textAlign: "center", padding: "20px", color: "#666" }}
            >
              <p>Todas as imagens foram carregadas</p>
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
                  maxWidth: "100%",
                  maxHeight: "100%",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {selectedImage && (
                  <div
                    style={{
                      position: "relative",
                      maxWidth: "100%",
                      height: "70%",
                    }}
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

                    {/* Show thumbnail first (already loaded) then try higher resolution */}
                    <img
                      src={`https://drive.google.com/thumbnail?sz=w400&id=${selectedImage.id}`}
                      alt={selectedImage.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        borderRadius: "8px",
                        filter: modalImageLoading ? "blur(2px)" : "none",
                        transition: "filter 0.3s ease",
                        display: "block",
                      }}
                      onLoad={() => setModalImageLoading(false)}
                    />

                    {/* Try to load higher resolution in background */}
                    {!modalImageLoading && (
                      <img
                        src={`https://drive.google.com/thumbnail?sz=w1200&id=${selectedImage.id}`}
                        alt={selectedImage.name}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          objectFit: "contain",
                          borderRadius: "8px",
                          position: "absolute",
                          top: 0,
                          left: 0,
                          opacity: 0,
                          transition: "opacity 0.5s ease",
                        }}
                        onLoad={(e) => {
                          // Smoothly replace the lower resolution image
                          e.target.style.opacity = 1;
                          // Hide the lower resolution image
                          e.target.previousElementSibling.style.opacity = 0;
                        }}
                        onError={() => {
                          // If high-res fails, just keep the low-res version
                          console.log(
                            "High-res version failed, keeping low-res"
                          );
                        }}
                      />
                    )}

                    {/* Loading indicator */}
                    {modalImageLoading && (
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          color: "white",
                          fontSize: "14px",
                          fontWeight: "500",
                          backgroundColor: "rgba(0, 0, 0, 0.7)",
                          padding: "8px 16px",
                          borderRadius: "20px",
                        }}
                      >
                        A carregar...
                      </div>
                    )}
                  </div>
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
                width="100vw"
                height="100vh"
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
                      width="100vw"
                      objectFit="contain"
                      borderRadius="8px"
                    />
                  )}
                </Dialog.Body>
              </Dialog.Content>
            </Dialog.Positioner>
          </Dialog.Root>
        </>
      )}
    </div>
  );
}
