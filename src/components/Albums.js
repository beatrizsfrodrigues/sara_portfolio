import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Image, Skeleton, Box } from "@chakra-ui/react";
import JSZip from "jszip";
import PasswordModal from "./PasswordModal";
import DownloadModal from "./DownloadModal";
import ImageWithRetry from "./ImageWithRetry";

import { saveAs } from "file-saver";

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
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadModalTitle, setDownloadModalTitle] = useState("");
  const [downloadModalMessage, setDownloadModalMessage] = useState("");
  const [downloadModalType, setDownloadModalType] = useState("info");
  const [showDownloadModalButtons, setShowDownloadModalButtons] =
    useState(true);

  const navigate = useNavigate();

  const backend_url = process.env.REACT_APP_BACKEND_URL;

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
      const res = await fetch(`${backend_url}/api/drive/password/${folderId}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      return data.passwordFileId || null;
    } catch (error) {
      console.error("Error checking password protection:", error);
      return null;
    }
  };

  // Function to get password from password.txt file
  const getPasswordFromFile = async (fileId) => {
    const res = await fetch(
      `${backend_url}/api/drive/password/content/${fileId}`
    );
    const password = await res.text();
    return password.trim();
  };

  // Function to handle folder click
  const handleFolderClick = async (folder, e) => {
    e.preventDefault();
    setCheckingPassword(true);

    const passwordFileId = await checkPasswordProtection(folder.id);

    // Portfolio mode: Direct navigation
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

    // Download mode: Always show password dialog
    if (download) {
      setSelectedFolder({ ...folder, passwordFileId, isDownloadMode: true });
      setIsPasswordDialogOpen(true);
      setPasswordInput("");
      setPasswordError("");
      setCheckingPassword(false);
      return;
    }

    // Sessions mode (lock=true): Check password
    if (passwordFileId) {
      setSelectedFolder({ ...folder, passwordFileId, isDownloadMode: false });
      setIsPasswordDialogOpen(true);
      setPasswordInput("");
      setPasswordError("");
    } else {
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

  // Updated handlePasswordSubmit
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
      const correctPassword = await getPasswordFromFile(
        selectedFolder.passwordFileId
      );

      if (!correctPassword) {
        setPasswordError("Erro ao carregar a palavra-passe");
        return;
      }

      if (passwordInput.replace(/\s+/g, "") === correctPassword) {
        if (selectedFolder.isDownloadMode) {
          // ✅ Keep modal open and allow closing
          showDownloadModal(
            "A baixar pasta...",
            "Por favor, aguarde...",
            "info", // info type
            true // allow closing
          );

          try {
            await handleFolderDownload(selectedFolder.id);
            showDownloadModal(
              "Sucesso!",
              "A pasta foi baixada com sucesso.",
              "success",
              true // allow closing after success
            );
          } catch (err) {
            console.error(err);
            showDownloadModal(
              "Erro!",
              "Falha ao baixar a pasta: " + err.message,
              "error",
              true // allow closing after error
            );
          }
        } else {
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

        setIsPasswordDialogOpen(false); // Close password modal after handling
      } else {
        setPasswordError("Palavra-passe incorreta");
        setPasswordInput("");
      }
    } catch (error) {
      console.error("Error validating password:", error);
      setPasswordError("Erro ao validar a palavra-passe");
    }
  };

  // Updated handleFolderDownload
  const handleFolderDownload = async (folderId) => {
    if (!folderId) return;

    try {
      // 1️⃣ Get list of files in folder
      const res = await fetch(`${backend_url}/api/download/${folderId}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (!data?.files?.length)
        throw new Error("Não foram encontrados ficheiros para download");

      const zip = new JSZip();

      // 2️⃣ Fetch each file content as blob
      await Promise.all(
        data.files.map(async (file) => {
          const fileRes = await fetch(`${backend_url}/api/download/${file.id}`);
          if (!fileRes.ok) throw new Error(`Falha ao buscar ${file.name}`);
          const blob = await fileRes.blob();
          zip.file(file.name, blob);
        })
      );

      // 3️⃣ Generate ZIP and trigger download
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `${selectedFolder.name || folderId}.zip`);
    } catch (err) {
      console.error("Error downloading folder:", err);
      throw err; // Re-throw to be caught in handlePasswordSubmit
    }
  };

  const closePasswordDialog = () => {
    setIsPasswordDialogOpen(false);
    setSelectedFolder(null);
    setPasswordInput("");
    setPasswordError("");
  };

  // Albums.js

  // ... (keep all other code the same)

  useEffect(() => {
    if (!rootFolderId) {
      console.error("No rootFolderId provided to Albums component");
      setLoading(false);
      return;
    }

    const fetchFolders = async () => {
      setLoading(true); // Ensure loading state is true at the start
      try {
        // ⭐ 1. Just fetch the data from our optimized endpoint. That's it!
        const res = await fetch(
          `${backend_url}/api/drive/folders/${rootFolderId}`
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch folders: HTTP ${res.status}`);
        }

        const foldersList = await res.json();

        // ⭐ 2. Set the state directly. No more looping or extra fetches are needed.
        setFolders(foldersList);
      } catch (error) {
        console.error("Failed to fetch folders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFolders();
  }, [rootFolderId, backend_url]); // Added backend_url to dependency array

  // ...

  // ...

  const skeletonCount = 8;

  return (
    <>
      <div className="grid">
        {loading ? (
          Array.from({ length: skeletonCount }).map((_, index) => (
            <Box key={index} width="100%">
              <Skeleton height="200px" mb="4" />
              <Skeleton height="20px" mb="2" />
              <Skeleton height="40px" />
            </Box>
          ))
        ) : folders.length === 0 ? (
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
              Não foram encontrados álbuns nesta secção.
            </p>
          </div>
        ) : (
          folders.map((folder) => {
            const imageUrl = folder.coverImageId
              ? `${backend_url}/thumbnail/${folder.coverImageId}`
              : "https://cdn.pixabay.com/photo/2021/02/26/16/29/error-404-6052476_1280.png";

            return (
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
                  className="album-card"
                  overflow="hidden"
                  width="100%"
                  height="300px"
                >
                  <ImageWithRetry
                    src={imageUrl}
                    alt={`Capa do álbum ${folder.name}`}
                    height="100%"
                  />
                  <Card.Body className="cardBody" gap="0">
                    <Card.Title>{folder.name}</Card.Title>
                    {download && (
                      <Button
                        colorPalette="gray"
                        color="rgb(203, 209, 214)"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFolderClick(folder, e);
                        }}
                        width="100%"
                        mt="2"
                        marginBottom="8px"
                        marginTop="-4px"
                        className="btnTransferir"
                      >
                        Transferir pasta
                      </Button>
                    )}
                  </Card.Body>
                </Card.Root>
              </div>
            );
          })
        )}
      </div>

      <PasswordModal
        isOpen={isPasswordDialogOpen}
        onClose={closePasswordDialog}
        selectedFolder={selectedFolder}
        passwordInput={passwordInput}
        setPasswordInput={setPasswordInput}
        passwordError={passwordError}
        onSubmit={handlePasswordSubmit}
      />

      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={closeDownloadModal}
        title={downloadModalTitle}
        message={downloadModalMessage}
        type={downloadModalType}
        showButtons={showDownloadModalButtons}
      />

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
              A verificar proteção...
            </p>
          </div>
        </div>
      )}
    </>
  );
}
