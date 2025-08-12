import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Image, Skeleton, Box } from "@chakra-ui/react";
import JSZip from "jszip";
import PasswordModal from "./PasswordModal";
import DownloadModal from "./DownloadModal";

const apiKey = process.env.REACT_APP_API_KEY;

if (!apiKey) {
  console.error("Missing required environment variable: REACT_APP_API_KEY");
}

export default function Albums({
  rootFolderId,
  download = false,
  lock = false,
}) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [checkingPassword, setCheckingPassword] = useState(false);

  // Download modal states
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadModalTitle, setDownloadModalTitle] = useState("");
  const [downloadModalMessage, setDownloadModalMessage] = useState("");
  const [downloadModalType, setDownloadModalType] = useState("info");
  const [showDownloadModalButtons, setShowDownloadModalButtons] =
    useState(true);

  const navigate = useNavigate();

  // Helper functions for download modal
  const showDownloadModal = (
    title,
    message,
    type = "info",
    showButtons = true
  ) => {
    setDownloadModalTitle(title);
    setDownloadModalMessage(message);
    setDownloadModalType(type);
    setShowDownloadModalButtons(showButtons);
    setIsDownloadModalOpen(true);
  };

  const closeDownloadModal = () => {
    setIsDownloadModalOpen(false);
  };

  // Function to check if folder has password.txt file
  const checkPasswordProtection = async (folderId) => {
    try {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+name='password.txt'&key=${apiKey}`
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const passwordFile =
        data.files && data.files.length > 0 ? data.files[0] : null;

      return passwordFile ? passwordFile.id : null;
    } catch (error) {
      console.error("Error checking password protection:", error);
      return null;
    }
  };

  // Function to get password from password.txt file
  const getPasswordFromFile = async (fileId) => {
    try {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const passwordContent = await res.text();
      return passwordContent.replace(/\s+/g, "");
    } catch (error) {
      console.error("Error fetching password:", error);
      return null;
    }
  };

  // Function to handle folder click
  const handleFolderClick = async (folder, e) => {
    e.preventDefault(); // Prevent default Link navigation

    setCheckingPassword(true);

    // Check if folder is password protected
    const passwordFileId = await checkPasswordProtection(folder.id);

    // Portfolio mode: Direct navigation regardless of password protection
    if (!lock && !download) {
      const authData = {
        folderId: folder.id,
        timestamp: Date.now(),
        authenticated: true,
        isPublic: true,
      };
      sessionStorage.setItem(
        `gallery_auth_${folder.id}`,
        JSON.stringify(authData)
      );
      navigate(`/gallery/${folder.id}/${encodeURIComponent(folder.name)}`);
      setCheckingPassword(false);
      return;
    }

    // Download mode: Always show password dialog for download, don't navigate to gallery
    if (download) {
      setSelectedFolder({ ...folder, passwordFileId, isDownloadMode: true });
      setIsPasswordDialogOpen(true);
      setPasswordInput("");
      setPasswordError("");
      setCheckingPassword(false);
      return;
    }

    // Sessions mode (lock=true): Check password protection for gallery access
    if (passwordFileId) {
      // Folder is password protected, show dialog
      setSelectedFolder({ ...folder, passwordFileId, isDownloadMode: false });
      setIsPasswordDialogOpen(true);
      setPasswordInput("");
      setPasswordError("");
    } else {
      // Folder is not password protected, store public auth and navigate directly
      const authData = {
        folderId: folder.id,
        timestamp: Date.now(),
        authenticated: true,
        isPublic: true,
      };
      sessionStorage.setItem(
        `gallery_auth_${folder.id}`,
        JSON.stringify(authData)
      );

      navigate(`/gallery/${folder.id}/${encodeURIComponent(folder.name)}`);
    }

    setCheckingPassword(false);
  };

  // Function to handle password submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (!passwordInput.trim()) {
      setPasswordError("Por favor, insira a palavra-passe");
      return;
    }

    if (!selectedFolder?.passwordFileId) {
      setPasswordError("Erro ao verificar a palavra-passe");
      return;
    }

    try {
      // Get the actual password from the file
      const correctPassword = await getPasswordFromFile(
        selectedFolder.passwordFileId
      );

      if (!correctPassword) {
        setPasswordError("Erro ao carregar a palavra-passe");
        return;
      }

      // Check if entered password matches (removing all whitespace from both)
      if (passwordInput.replace(/\s+/g, "") === correctPassword) {
        // Password correct
        setIsPasswordDialogOpen(false);

        if (selectedFolder.isDownloadMode) {
          // Download mode: Trigger download instead of navigation
          handleFolderDownload(selectedFolder);
        } else {
          // Gallery mode: Store auth in sessionStorage and navigate
          const authData = {
            folderId: selectedFolder.id,
            timestamp: Date.now(),
            authenticated: true,
          };
          sessionStorage.setItem(
            `gallery_auth_${selectedFolder.id}`,
            JSON.stringify(authData)
          );

          navigate(
            `/gallery/${selectedFolder.id}/${encodeURIComponent(
              selectedFolder.name
            )}`
          );
        }
      } else {
        setPasswordError("Palavra-passe incorreta");
        setPasswordInput("");
      }
    } catch (error) {
      console.error("Error validating password:", error);
      setPasswordError("Erro ao validar a palavra-passe");
    }
  };

  // Function to handle folder download
  const handleFolderDownload = async (folder) => {
    try {
      // Show loading modal
      showDownloadModal(
        "A Preparar Download",
        "Esta operação pode demorar alguns minutos dependendo do número de imagens.\n\nPor favor aguarde...",
        "loading",
        false
      );

      // Fetch all images in the folder
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folder.id}'+in+parents+and+mimeType+contains+'image/'&fields=files(id,name)&key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch folder contents: ${response.status}`);
      }

      const data = await response.json();
      const images = data.files || [];

      if (images.length === 0) {
        showDownloadModal(
          "Pasta Vazia",
          "Nenhuma imagem encontrada nesta pasta.",
          "info"
        );
        return;
      }

      // Create a new ZIP file
      const zip = new JSZip();
      let successCount = 0;
      let errorCount = 0;

      // Download each image and add to ZIP
      for (let i = 0; i < images.length; i++) {
        const image = images[i];

        try {
          console.log(`Downloading ${i + 1}/${images.length}: ${image.name}`);

          const imageResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${image.id}?alt=media&key=${apiKey}`
          );

          if (imageResponse.ok) {
            const blob = await imageResponse.blob();

            // Ensure the filename has an extension
            let filename = image.name;
            if (!filename.match(/\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i)) {
              // Try to detect format from blob type or default to jpg
              const extension = blob.type.split("/")[1] || "jpg";
              filename = `${filename}.${extension}`;
            }

            // Add image to ZIP
            zip.file(filename, blob);
            successCount++;
          } else {
            console.error(
              `Failed to download ${image.name}: HTTP ${imageResponse.status}`
            );
            errorCount++;
          }
        } catch (error) {
          console.error(`Failed to download ${image.name}:`, error);
          errorCount++;
        }

        // Small delay between requests to avoid rate limiting
        if (i < images.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      if (successCount === 0) {
        showDownloadModal(
          "Erro de Download",
          "Não foi possível fazer download de nenhuma imagem.",
          "error"
        );
        return;
      }

      // Generate ZIP file
      console.log("Generating ZIP file...");
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 6,
        },
      });

      // Create download link for ZIP
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${folder.name || "Pasta"}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show completion message
      const message =
        errorCount > 0
          ? `Download concluído! ${successCount} imagens adicionadas ao ZIP. ${errorCount} imagens falharam.`
          : `Download concluído! ${successCount} imagens no ficheiro ZIP.`;

      showDownloadModal("Download Concluído", message, "success");
    } catch (error) {
      console.error("Error downloading folder:", error);
      showDownloadModal(
        "Erro de Download",
        "Erro ao fazer download da pasta. Tente novamente.",
        "error"
      );
    }
  };

  const closePasswordDialog = () => {
    setIsPasswordDialogOpen(false);
    setSelectedFolder(null);
    setPasswordInput("");
    setPasswordError("");
  };

  useEffect(() => {
    // Only fetch if we have a valid rootFolderId
    if (!rootFolderId) {
      console.error("No rootFolderId provided to Albums component");
      setLoading(false);
      return;
    }

    async function fetchFolders() {
      try {
        const foldersRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q='${rootFolderId}'+in+parents+and+mimeType='application/vnd.google-apps.folder'&key=${apiKey}`
        );
        const foldersData = await foldersRes.json();
        const folderList = foldersData.files || [];

        const foldersWithImages = await Promise.all(
          folderList.map(async (folder) => {
            let coverImageId = null;

            try {
              // First, check if there's a "cover" folder inside this album
              const coverFolderRes = await fetch(
                `https://www.googleapis.com/drive/v3/files?q='${folder.id}'+in+parents+and+name='cover'+and+mimeType='application/vnd.google-apps.folder'&fields=files(id)&pageSize=1&key=${apiKey}`
              );
              const coverFolderData = await coverFolderRes.json();
              const coverFolder = coverFolderData.files?.[0];

              if (coverFolder) {
                // Cover folder exists, get the first image from it
                const coverImageRes = await fetch(
                  `https://www.googleapis.com/drive/v3/files?q='${coverFolder.id}'+in+parents+and+mimeType contains 'image/'&fields=files(id)&pageSize=1&key=${apiKey}`
                );
                const coverImageData = await coverImageRes.json();
                const coverImage = coverImageData.files?.[0];

                if (coverImage) {
                  coverImageId = coverImage.id;
                }
              }

              // If no cover image found, fall back to first image in main album
              if (!coverImageId) {
                const firstImageRes = await fetch(
                  `https://www.googleapis.com/drive/v3/files?q='${folder.id}'+in+parents+and+mimeType contains 'image/'&fields=files(id)&pageSize=1&key=${apiKey}`
                );
                const firstImageData = await firstImageRes.json();
                const firstImage = firstImageData.files?.[0];
                coverImageId = firstImage?.id || null;
              }
            } catch (error) {
              console.error(
                `Error fetching cover for folder ${folder.name}:`,
                error
              );
              // Fall back to trying to get first image from main album
              try {
                const firstImageRes = await fetch(
                  `https://www.googleapis.com/drive/v3/files?q='${folder.id}'+in+parents+and+mimeType contains 'image/'&fields=files(id)&pageSize=1&key=${apiKey}`
                );
                const firstImageData = await firstImageRes.json();
                const firstImage = firstImageData.files?.[0];
                coverImageId = firstImage?.id || null;
              } catch (fallbackError) {
                console.error(
                  `Fallback error for folder ${folder.name}:`,
                  fallbackError
                );
              }
            }

            return {
              ...folder,
              firstImageId: coverImageId,
            };
          })
        );
        setFolders(foldersWithImages);
      } catch (error) {
        console.error("Failed to fetch folders or images:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFolders();
  }, [rootFolderId]);

  // Define the number of skeleton cards you want to show
  const skeletonCount = 8;

  return (
    <>
      <div className="grid">
        {loading ? (
          // Render skeleton placeholders while loading
          Array.from({ length: skeletonCount }).map((_, index) => (
            <Box key={index} width="100%">
              <Skeleton height="200px" mb="4" />
              <Skeleton height="20px" mb="2" />
              <Skeleton height="40px" />
            </Box>
          ))
        ) : folders.length === 0 ? (
          // Show empty state when no folders found
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "60px 20px",
              color: "#666",
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>
              Nada para ver aqui
            </h3>
            <p style={{ margin: "0", fontSize: "14px" }}>
              Não foram encontrados albuns nesta secção.
            </p>
          </div>
        ) : (
          // Render the actual cards after loading is complete
          folders.map((folder) => (
            <div
              key={folder.id}
              style={{
                cursor: download ? "default" : "pointer",
                width: "100%",
              }}
              onClick={
                download ? undefined : (e) => handleFolderClick(folder, e)
              }
            >
              <Card.Root
                overflow="hidden"
                width="100%"
                height={download ? "350px" : "300px"}
              >
                {folder.firstImageId ? (
                  <Image
                    src={`https://drive.google.com/thumbnail?sz=w640&id=${folder.firstImageId}`}
                    alt={`First image from ${folder.name}`}
                    height="200px"
                  />
                ) : (
                  <Image
                    src="https://cdn.pixabay.com/photo/2021/02/26/16/29/error-404-6052476_1280.png"
                    alt="No image found"
                    height="200px"
                  />
                )}
                <Card.Body gap="2">
                  <Card.Title>{folder.name}</Card.Title>
                  {download && (
                    <Button
                      colorPalette="blue"
                      variant="solid"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFolderClick(folder, e);
                      }}
                      width="100%"
                      mt="2"
                    >
                      Transferir pasta
                    </Button>
                  )}
                </Card.Body>
              </Card.Root>
            </div>
          ))
        )}
      </div>

      {/* Password Protection Modal */}
      <PasswordModal
        isOpen={isPasswordDialogOpen}
        onClose={closePasswordDialog}
        selectedFolder={selectedFolder}
        passwordInput={passwordInput}
        setPasswordInput={setPasswordInput}
        passwordError={passwordError}
        onSubmit={handlePasswordSubmit}
      />

      {/* Download Modal */}
      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={closeDownloadModal}
        title={downloadModalTitle}
        message={downloadModalMessage}
        type={downloadModalType}
        showButtons={showDownloadModalButtons}
      />

      {/* Loading overlay when checking password */}
      {checkingPassword && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <Skeleton height="20px" width="200px" margin="0 auto" />
            <p style={{ marginTop: "16px", color: "#666", fontSize: "14px" }}>
              A verificar protecção...
            </p>
          </div>
        </div>
      )}
    </>
  );
}
