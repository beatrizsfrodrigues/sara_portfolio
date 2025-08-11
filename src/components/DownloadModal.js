import React from "react";
import { Button, Dialog } from "@chakra-ui/react";

export default function DownloadModal({
  isOpen,
  onClose,
  title,
  message,
  type = "info", // "info", "loading", "success", "error"
  showButtons = true,
}) {
  const getColor = () => {
    switch (type) {
      case "loading":
        return "blue.600";
      case "success":
        return "green.600";
      case "error":
        return "red.600";
      default:
        return "gray.800";
    }
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details) => {
        if (!details.open && showButtons) {
          onClose();
        }
      }}
    >
      <Dialog.Backdrop bg="blackAlpha.600" />
      <Dialog.Positioner>
        <Dialog.Content
          maxW="500px"
          bg="white"
          borderRadius="12px"
          p="6"
          boxShadow="xl"
          margin={4}
        >
          <Dialog.Header>
            <Dialog.Title fontSize="xl" fontWeight="bold" color={getColor()}>
              {title}
            </Dialog.Title>
          </Dialog.Header>

          <Dialog.Body>
            <div style={{ marginBottom: showButtons ? "20px" : "0" }}>
              <p
                style={{
                  color: "#666",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  whiteSpace: "pre-line",
                }}
              >
                {message}
              </p>
            </div>

            {showButtons && (
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                }}
              >
                <Button colorPalette="blue" variant="solid" onClick={onClose}>
                  OK
                </Button>
              </div>
            )}
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
