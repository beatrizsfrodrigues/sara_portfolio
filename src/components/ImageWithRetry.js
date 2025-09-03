import React, { useState } from "react";
import { Box, Image, Spinner } from "@chakra-ui/react";

const ImageWithRetry = ({
  src,
  alt,
  style,
  objectFit = "cover", // default
  _hover,
  onError,
  onLoad,
  onClick,
  onErrorCount,
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const maxRetries = 2;

  const handleImageError = async () => {
    if (retryCount < maxRetries) {
      const delayTime = 2000 * Math.pow(2, retryCount);
      await new Promise((r) => setTimeout(r, delayTime));
      setRetryCount((prev) => prev + 1);
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
    setLoading(false);
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
        height="100%" // enforce full height
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
    <Box
      position="relative"
      style={style}
      cursor={onClick ? "pointer" : "default"}
      height="100%" // enforce full height of parent
      width="100%" // enforce full width
      overflow="hidden"
      borderRadius="6px"
    >
      {loading && (
        <Box
          position="absolute"
          top="0"
          left="0"
          width="100%"
          height="100%"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="gray.100"
        >
          <Spinner size="md" color="gray.500" />
        </Box>
      )}

      <Image
        src={imageSrc}
        alt={alt}
        width="100%"
        height="100%"
        objectFit={objectFit} // cover will fill the card
        display={loading ? "none" : "block"}
        _hover={_hover}
        onError={handleImageError}
        onLoad={handleImageLoad}
        onClick={onClick}
        onContextMenu={(e) => e.preventDefault()}
      />
    </Box>
  );
};

export default ImageWithRetry;
