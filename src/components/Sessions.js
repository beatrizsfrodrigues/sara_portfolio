import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Text,
  Button,
  Card,
  Image,
  Skeleton,
  Box,
  Dialog,
} from "@chakra-ui/react";

const apiKey = process.env.REACT_APP_API_KEY;
const rootFolderId = process.env.REACT_APP_ROOT_FOLDER_ID;

if (!apiKey || !rootFolderId) {
  console.error(
    "Missing required environment variables: REACT_APP_API_KEY or REACT_APP_ROOT_FOLDER_ID"
  );
}

export default function Sessions() {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [checkingPassword, setCheckingPassword] = useState(false);

  const navigate = useNavigate();

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
      return passwordContent.trim();
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

    if (passwordFileId) {
      // Folder is password protected, show dialog
      setSelectedFolder({ ...folder, passwordFileId });
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

      // Check if entered password matches
      if (passwordInput.trim() === correctPassword) {
        // Password correct, store auth in sessionStorage and navigate
        setIsPasswordDialogOpen(false);

        // Store authentication in sessionStorage (cleared when tab closes)
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
      } else {
        setPasswordError("Palavra-passe incorreta");
        setPasswordInput("");
      }
    } catch (error) {
      console.error("Error validating password:", error);
      setPasswordError("Erro ao validar a palavra-passe");
    }
  };

  const closePasswordDialog = () => {
    setIsPasswordDialogOpen(false);
    setSelectedFolder(null);
    setPasswordInput("");
    setPasswordError("");
  };

  useEffect(() => {
    async function fetchFolders() {
      try {
        const foldersRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q='${rootFolderId}'+in+parents+and+mimeType='application/vnd.google-apps.folder'&key=${apiKey}`
        );
        const foldersData = await foldersRes.json();
        const folderList = foldersData.files || [];

        const foldersWithImages = await Promise.all(
          folderList.map(async (folder) => {
            const firstImageRes = await fetch(
              `https://www.googleapis.com/drive/v3/files?q='${folder.id}'+in+parents+and+mimeType contains 'image/'&fields=files(id)&pageSize=1&key=${apiKey}`
            );
            const firstImageData = await firstImageRes.json();
            const firstImage = firstImageData.files?.[0];

            return {
              ...folder,
              firstImageId: firstImage?.id || null,
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
  }, []);

  // Define the number of skeleton cards you want to show
  const skeletonCount = 8;

  return (
    <div className="bodyDiv">
      <h1>Sessões</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "16px",
          gridAutoRows: "auto",
        }}
      >
        {loading
          ? // Render skeleton placeholders while loading
            Array.from({ length: skeletonCount }).map((_, index) => (
              <Box key={index} width="100%">
                <Skeleton height="200px" mb="4" />
                <Skeleton height="20px" mb="2" />
                <Skeleton height="40px" />
              </Box>
            ))
          : // Render the actual cards after loading is complete
            folders.map((folder) => (
              <div
                key={folder.id}
                style={{ cursor: "pointer", width: "100%" }}
                onClick={(e) => handleFolderClick(folder, e)}
              >
                <Card.Root overflow="hidden" width="100%" height="300px">
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
                  </Card.Body>
                </Card.Root>
              </div>
            ))}
      </div>

      {/* Password Protection Dialog */}
      <Dialog.Root
        open={isPasswordDialogOpen}
        onOpenChange={(details) => {
          if (!details.open) {
            closePasswordDialog();
          }
        }}
      >
        <Dialog.Backdrop bg="blackAlpha.600" />
        <Dialog.Positioner>
          <Dialog.Content
            maxW="400px"
            bg="white"
            borderRadius="12px"
            p="6"
            boxShadow="xl"
          >
            <Dialog.Header>
              <Dialog.Title fontSize="xl" fontWeight="bold" color="gray.800">
                🔒 Album Protegido
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <div style={{ marginBottom: "20px" }}>
                <p
                  style={{
                    color: "#666",
                    fontSize: "14px",
                    margin: "0 0 16px 0",
                  }}
                >
                  O album "{selectedFolder?.name}" requer uma palavra-passe para
                  aceder.
                </p>

                <form onSubmit={handlePasswordSubmit}>
                  <div style={{ marginBottom: "16px" }}>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Introduza a palavra-passe"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: passwordError
                          ? "2px solid #e74c3c"
                          : "2px solid #ddd",
                        borderRadius: "8px",
                        fontSize: "16px",
                        outline: "none",
                        transition: "border-color 0.2s",
                        boxSizing: "border-box",
                      }}
                      autoFocus
                    />
                  </div>

                  {passwordError && (
                    <div
                      style={{
                        color: "#e74c3c",
                        fontSize: "14px",
                        marginBottom: "16px",
                      }}
                    >
                      {passwordError}
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <Button variant="outline" onClick={closePasswordDialog}>
                      Cancelar
                    </Button>
                    <Button type="submit" colorPalette="blue" variant="solid">
                      Entrar
                    </Button>
                  </div>
                </form>
              </div>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

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
    </div>
  );
}
