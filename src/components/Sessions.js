import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Text, Button, Card, Image, Skeleton, Box } from "@chakra-ui/react";

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
  const skeletonCount = 6;

  return (
    <div className="bodyDiv">
      <h1>Sessões</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
        {loading
          ? // Render skeleton placeholders while loading
            Array.from({ length: skeletonCount }).map((_, index) => (
              <Box key={index} width="360px">
                <Skeleton height="200px" mb="4" />
                <Skeleton height="20px" mb="2" />
                <Skeleton height="40px" />
              </Box>
            ))
          : // Render the actual cards after loading is complete
            folders.map((folder) => (
              <Link to={`/gallery/${folder.id}`}>
                <Card.Root
                  maxW="sm"
                  overflow="hidden"
                  key={folder.id}
                  width="360px"
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
                  </Card.Body>
                  {/* <Card.Footer gap="2">
                    <Link to={`/gallery/${folder.id}`}>
                      <Button variant="solid">Ver</Button>
                    </Link>
                  </Card.Footer> */}
                </Card.Root>
              </Link>
            ))}
      </div>
    </div>
  );
}
