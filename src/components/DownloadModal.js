import React from "react";
import { Dialog } from "@chakra-ui/react";

export default function DownloadModal({
  isOpen,
  onClose,
  title,
  message,
  type = "info", // "info", "loading", "success", "error"
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
        // Only allow closing if not loading
        if (!details.open && type !== "loading") {
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
            <div style={{ marginBottom: "20px" }}>
              <p
                style={{
                  color: "#666",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  whiteSpace: "pre-line",
                  textAlign: "center",
                }}
              >
                {message}
              </p>
            </div>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
