import React from "react";
import { Button, Dialog } from "@chakra-ui/react";

export default function PasswordModal({
  isOpen,
  onClose,
  selectedFolder,
  passwordInput,
  setPasswordInput,
  passwordError,
  onSubmit,
}) {
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details) => {
        if (!details.open) {
          onClose();
        }
      }}
    >
      <Dialog.Backdrop bg="blackAlpha.600" />
      <Dialog.Positioner>
        <Dialog.Content
          maxW="400px"
          bg="white"
          borderRadius="12px"
          p="2"
          boxShadow="xl"
          margin={4}
        >
          <Dialog.Header>
            <Dialog.Title fontSize="xl" fontWeight="bold" color="gray.800">
              {selectedFolder?.isDownloadMode
                ? "Download Protegido"
                : "Album Protegido"}
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
                {selectedFolder?.isDownloadMode
                  ? `O download da pasta "${selectedFolder?.name}" requer uma palavra-passe.`
                  : `O album "${selectedFolder?.name}" requer uma palavra-passe para aceder.`}
              </p>

              <form onSubmit={onSubmit}>
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
                  <Button variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" colorPalette="blue" variant="solid">
                    {selectedFolder?.isDownloadMode ? "Download" : "Entrar"}
                  </Button>
                </div>
              </form>
            </div>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
